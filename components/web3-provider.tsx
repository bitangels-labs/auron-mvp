"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { WalletConnectModal } from "@/components/wallet-connect-modal"
import {
  getStoredWalletId,
  getWalletInstallUrl,
  getWalletLabel,
  getWalletProvider,
  setStoredWalletId,
  type WalletId,
} from "@/lib/wallets"

import dETHAbi from "@/lib/abis/dETH.json"
import sETHAbi from "@/lib/abis/sETH.json"
import governanceAbi from "@/lib/abis/governance.json"
import stakingDashboardAbi from "@/lib/abis/stakingDashboard.json"
import {
  DETH_ADDRESS,
  GOVERNANCE_ADDRESS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_EXPLORER,
  SEPOLIA_NETWORK_NAME,
  SEPOLIA_RPC_URL,
  SETH_ADDRESS,
  STAKING_DASHBOARD_ADDRESS,
} from "@/lib/contracts"

type Web3ContextType = {
  account: string | null
  provider: ethers.JsonRpcProvider | null
  signer: ethers.JsonRpcSigner | null
  dETHContract: ethers.Contract | null
  sETHContract: ethers.Contract | null
  governanceContract: ethers.Contract | null
  stakingDashboardContract: ethers.Contract | null
  openWalletModal: () => void
  connectWallet: (walletId: WalletId) => Promise<void>
  disconnectWallet: () => void
  isConnected: boolean
  chainId: number | null
  refreshBalances: () => Promise<void>
  networkName: string
  connectedWalletId: WalletId | null
  ethBalance: string
  dETHBalance: string
  sETHBalance: string
  isWalletModalOpen: boolean
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  provider: null,
  signer: null,
  dETHContract: null,
  sETHContract: null,
  governanceContract: null,
  stakingDashboardContract: null,
  openWalletModal: () => {},
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isConnected: false,
  chainId: null,
  refreshBalances: async () => {},
  networkName: "",
  connectedWalletId: null,
  ethBalance: "0",
  dETHBalance: "0",
  sETHBalance: "0",
  isWalletModalOpen: false,
})

export const useWeb3 = () => useContext(Web3Context)

async function ensureSepoliaNetwork(walletProvider: EIP1193Provider) {
  const chainIdHex = (await walletProvider.request({ method: "eth_chainId" })) as string
  const currentChainId = Number.parseInt(chainIdHex, 16)

  if (currentChainId === SEPOLIA_CHAIN_ID) return

  try {
    await walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
    })
  } catch (switchError: unknown) {
    const error = switchError as { code?: number }
    if (error.code === 4902) {
      await walletProvider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: SEPOLIA_NETWORK_NAME,
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [SEPOLIA_RPC_URL],
            blockExplorerUrls: [SEPOLIA_EXPLORER],
          },
        ],
      })
      return
    }
    throw switchError
  }
}

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [dETHContract, setDETHContract] = useState<ethers.Contract | null>(null)
  const [sETHContract, setSETHContract] = useState<ethers.Contract | null>(null)
  const [governanceContract, setGovernanceContract] = useState<ethers.Contract | null>(null)
  const [stakingDashboardContract, setStakingDashboardContract] = useState<ethers.Contract | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [networkName, setNetworkName] = useState("")
  const [connectedWalletId, setConnectedWalletId] = useState<WalletId | null>(null)
  const [ethBalance, setEthBalance] = useState("0")
  const [dETHBalance, setDETHBalance] = useState("0")
  const [sETHBalance, setSETHBalance] = useState("0")
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [connectingWalletId, setConnectingWalletId] = useState<WalletId | null>(null)

  const activeWalletProviderRef = useRef<EIP1193Provider | null>(null)
  const { toast } = useToast()

  const updateBalances = useCallback(async (address: string, readProvider: ethers.JsonRpcProvider) => {
    try {
      const balance = await readProvider.getBalance(address)
      setEthBalance(ethers.formatEther(balance))
    } catch {
      setEthBalance("0")
    }

    try {
      const dETH = new ethers.Contract(DETH_ADDRESS, dETHAbi, readProvider)
      const dETHBal = await dETH.balanceOf(address)
      setDETHBalance(ethers.formatEther(dETHBal))
    } catch {
      setDETHBalance("0")
    }

    try {
      const sETH = new ethers.Contract(SETH_ADDRESS, sETHAbi, readProvider)
      const sETHBal = await sETH.balanceOf(address)
      setSETHBalance(ethers.formatEther(sETHBal))
    } catch {
      setSETHBalance("0")
    }
  }, [])

  const initializeSession = useCallback(
    async (walletProvider: EIP1193Provider, walletId: WalletId, userAddress: string, showToast: boolean) => {
      await ensureSepoliaNetwork(walletProvider)

      const directProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL)
      const browserProvider = new ethers.BrowserProvider(walletProvider)
      const web3Signer = await browserProvider.getSigner()
      const network = await directProvider.getNetwork()

      activeWalletProviderRef.current = walletProvider
      setConnectedWalletId(walletId)
      setStoredWalletId(walletId)
      setNetworkName(getWalletLabel(walletId))
      setAccount(userAddress)
      setProvider(directProvider)
      setSigner(web3Signer)
      setIsConnected(true)
      setChainId(Number(network.chainId))

      const dETH = new ethers.Contract(DETH_ADDRESS, dETHAbi, web3Signer)
      const sETH = new ethers.Contract(SETH_ADDRESS, sETHAbi, web3Signer)
      const governance = new ethers.Contract(GOVERNANCE_ADDRESS, governanceAbi, web3Signer)
      const stakingDashboard = new ethers.Contract(STAKING_DASHBOARD_ADDRESS, stakingDashboardAbi, web3Signer)

      setDETHContract(dETH)
      setSETHContract(sETH)
      setGovernanceContract(governance)
      setStakingDashboardContract(stakingDashboard)

      await updateBalances(userAddress, directProvider)

      if (showToast) {
        toast({
          title: "Wallet Connected",
          description: `Connected to ${getWalletLabel(walletId)} (${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)})`,
        })
      }
    },
    [toast, updateBalances],
  )

  const connectWallet = useCallback(
    async (walletId: WalletId) => {
      setConnectingWalletId(walletId)

      try {
        const walletProvider = await getWalletProvider(walletId)

        if (!walletProvider) {
          window.open(getWalletInstallUrl(walletId), "_blank", "noopener,noreferrer")
          toast({
            title: `${getWalletLabel(walletId)} Not Found`,
            description: "Install the wallet extension, then try connecting again.",
            variant: "destructive",
          })
          return
        }

        // Wallet extension handles unlock/password and dApp approval here.
        const accounts = (await walletProvider.request({
          method: "eth_requestAccounts",
        })) as string[]

        if (!accounts.length) {
          throw new Error("No accounts returned")
        }

        await initializeSession(walletProvider, walletId, accounts[0], true)
        setIsWalletModalOpen(false)
      } catch (error: unknown) {
        const walletError = error as { code?: number; message?: string }

        if (walletError.code === 4001) {
          toast({
            title: "Connection Cancelled",
            description: "You declined the wallet connection request.",
          })
          return
        }

        console.error("Error connecting wallet:", error)
        toast({
          title: "Connection Failed",
          description: walletError.message || "Failed to connect wallet. Please try again.",
          variant: "destructive",
        })
      } finally {
        setConnectingWalletId(null)
      }
    },
    [initializeSession, toast],
  )

  const openWalletModal = useCallback(() => {
    setIsWalletModalOpen(true)
  }, [])

  const disconnectWallet = useCallback(() => {
    activeWalletProviderRef.current?.removeAllListeners?.()
    activeWalletProviderRef.current = null
    setStoredWalletId(null)
    setConnectedWalletId(null)
    setAccount(null)
    setSigner(null)
    setProvider(null)
    setDETHContract(null)
    setSETHContract(null)
    setGovernanceContract(null)
    setStakingDashboardContract(null)
    setIsConnected(false)
    setChainId(null)
    setNetworkName("")
    setEthBalance("0")
    setDETHBalance("0")
    setSETHBalance("0")

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    })
  }, [toast])

  const refreshBalances = useCallback(async () => {
    if (account && provider) {
      await updateBalances(account, provider)
    }
  }, [account, provider, updateBalances])

  // Silently restore a previous session without opening the wallet modal.
  useEffect(() => {
    const restoreSession = async () => {
      const storedWalletId = getStoredWalletId()
      if (!storedWalletId) return

      const walletProvider = await getWalletProvider(storedWalletId)
      if (!walletProvider) return

      try {
        const accounts = (await walletProvider.request({ method: "eth_accounts" })) as string[]
        if (accounts.length > 0) {
          await initializeSession(walletProvider, storedWalletId, accounts[0], false)
        }
      } catch (error) {
        console.error("Error restoring wallet session:", error)
      }
    }

    restoreSession()
  }, [initializeSession])

  useEffect(() => {
    const walletProvider = activeWalletProviderRef.current
    if (!walletProvider) return

    const handleAccountsChanged = async (accounts: unknown) => {
      const nextAccounts = accounts as string[]
      if (nextAccounts.length > 0) {
        setAccount(nextAccounts[0])
        if (provider) {
          await updateBalances(nextAccounts[0], provider)
        }
      } else {
        disconnectWallet()
      }
    }

    const handleChainChanged = async (nextChainId: unknown) => {
      const parsedChainId = Number.parseInt(nextChainId as string, 16)
      setChainId(parsedChainId)

      if (parsedChainId !== SEPOLIA_CHAIN_ID) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Ethereum Sepolia testnet.",
          variant: "destructive",
        })
        setIsConnected(false)
        setNetworkName("")
      } else if (account && connectedWalletId) {
        setNetworkName(getWalletLabel(connectedWalletId))
        setIsConnected(true)
        if (provider) {
          await updateBalances(account, provider)
        }
      }
    }

    walletProvider.on?.("accountsChanged", handleAccountsChanged)
    walletProvider.on?.("chainChanged", handleChainChanged)

    return () => {
      walletProvider.removeListener?.("accountsChanged", handleAccountsChanged)
      walletProvider.removeListener?.("chainChanged", handleChainChanged)
    }
  }, [account, connectedWalletId, disconnectWallet, provider, toast, updateBalances])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isConnected && account && provider) {
      intervalId = setInterval(() => {
        updateBalances(account, provider)
      }, 15000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isConnected, account, provider, updateBalances])

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        dETHContract,
        sETHContract,
        governanceContract,
        stakingDashboardContract,
        openWalletModal,
        connectWallet,
        disconnectWallet,
        isConnected,
        chainId,
        refreshBalances,
        networkName,
        connectedWalletId,
        ethBalance,
        dETHBalance,
        sETHBalance,
        isWalletModalOpen,
      }}
    >
      {children}
      <WalletConnectModal
        open={isWalletModalOpen}
        onOpenChange={setIsWalletModalOpen}
        onSelectWallet={connectWallet}
        connectingWalletId={connectingWalletId}
      />
    </Web3Context.Provider>
  )
}
