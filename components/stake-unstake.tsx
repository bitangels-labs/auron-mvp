"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useWeb3 } from "@/components/web3-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { Layers, ArrowUpFromLine, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function StakeUnstake() {
  const { dETHContract, sETHContract, isConnected, dETHBalance, sETHBalance, refreshBalances, account } = useWeb3()
  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [allowance, setAllowance] = useState("0")
  const [isApproving, setIsApproving] = useState(false)
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false)
  const [activeTab, setActiveTab] = useState("stake")
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "unstake") setActiveTab("unstake")
    if (tab === "stake") setActiveTab("stake")
  }, [searchParams])

  // Fungsi untuk memeriksa allowance dengan penanganan error yang lebih baik
  const checkAllowance = async () => {
    if (!dETHContract || !sETHContract || !isConnected || !account) {
      console.log("Cannot check allowance: missing required data", {
        hasDETHContract: !!dETHContract,
        hasSETHContract: !!sETHContract,
        isConnected,
        account,
      })
      return
    }

    try {
      setIsCheckingAllowance(true)

      // Pastikan sETHContract.address tidak null
      const sETHAddress = sETHContract.target || sETHContract.address

      if (!sETHAddress) {
        console.error("sETH contract address is null or undefined")
        return
      }

      console.log("Checking allowance for:", {
        owner: account,
        spender: sETHAddress,
      })

      const currentAllowance = await dETHContract.allowance(account, sETHAddress)
      console.log("Current allowance:", ethers.formatEther(currentAllowance))

      setAllowance(ethers.formatEther(currentAllowance))
    } catch (error) {
      console.error("Error checking allowance:", error)
    } finally {
      setIsCheckingAllowance(false)
    }
  }

  // Periksa allowance saat komponen dimuat atau saat data yang diperlukan berubah
  useEffect(() => {
    checkAllowance()
  }, [dETHContract, sETHContract, isConnected, account])

  const handleApprove = async () => {
    if (!dETHContract || !sETHContract) return

    try {
      setIsApproving(true)

      // Pastikan sETHContract.address tidak null
      const sETHAddress = sETHContract.target || sETHContract.address

      if (!sETHAddress) {
        toast({
          title: "Error",
          description: "Cannot get sETH contract address",
          variant: "destructive",
        })
        return
      }

      // Gunakan MaxUint256 dari ethers v6
      const maxUint256 = ethers.MaxUint256

      console.log("Approving sETH contract:", sETHAddress)
      const tx = await dETHContract.approve(sETHAddress, maxUint256)

      toast({
        title: "Approval Submitted",
        description: "Your approval transaction has been submitted.",
      })

      await tx.wait()

      // Update allowance
      await checkAllowance()

      toast({
        title: "Approval Successful",
        description: "You can now stake your dETH tokens.",
      })
    } catch (error) {
      console.error("Error approving tokens:", error)
      toast({
        title: "Approval Failed",
        description: "There was an error approving your tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleStake = async () => {
    if (!sETHContract || !stakeAmount) return

    try {
      setIsStaking(true)
      const amount = ethers.parseEther(stakeAmount)

      // Check if user has enough dETH
      if (Number.parseFloat(dETHBalance) < Number.parseFloat(stakeAmount)) {
        toast({
          title: "Insufficient dETH Balance",
          description: "You don't have enough dETH to stake this amount.",
          variant: "destructive",
        })
        return
      }

      // Check if allowance is sufficient
      if (Number.parseFloat(allowance) < Number.parseFloat(stakeAmount)) {
        toast({
          title: "Insufficient Allowance",
          description: "Please approve dETH tokens before staking.",
          variant: "destructive",
        })
        return
      }

      const tx = await sETHContract.stake(amount)
      toast({
        title: "Transaction Submitted",
        description: "Your staking transaction has been submitted.",
      })

      await tx.wait()

      toast({
        title: "Staking Successful",
        description: `Successfully staked ${stakeAmount} dETH and received sETH.`,
      })

      setStakeAmount("")
      refreshBalances()
      checkAllowance()
    } catch (error) {
      console.error("Error staking dETH:", error)
      toast({
        title: "Staking Failed",
        description: "There was an error processing your stake. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async () => {
    if (!sETHContract || !unstakeAmount) return

    try {
      setIsUnstaking(true)
      const amount = ethers.parseEther(unstakeAmount)

      // Check if user has enough sETH
      if (Number.parseFloat(sETHBalance) < Number.parseFloat(unstakeAmount)) {
        toast({
          title: "Insufficient sETH Balance",
          description: "You don't have enough sETH to unstake this amount.",
          variant: "destructive",
        })
        return
      }

      const tx = await sETHContract.unstake(amount)
      toast({
        title: "Transaction Submitted",
        description: "Your unstaking transaction has been submitted.",
      })

      await tx.wait()

      toast({
        title: "Unstaking Successful",
        description: `Successfully unstaked ${unstakeAmount} sETH and received dETH.`,
      })

      setUnstakeAmount("")
      refreshBalances()
      checkAllowance()
    } catch (error) {
      console.error("Error unstaking sETH:", error)
      toast({
        title: "Unstaking Failed",
        description: "There was an error processing your unstake. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUnstaking(false)
    }
  }

  const setMaxStake = () => {
    setStakeAmount(dETHBalance)
  }

  const setMaxUnstake = () => {
    setUnstakeAmount(sETHBalance)
  }

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-lightblue-600 mb-4">Please connect your wallet to access staking features.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Stake & Unstake</h1>

      <Tabs defaultValue="stake" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake">Unstake</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="animate-slide-in">
          <div className="action-card">
            <h2 className="text-xl font-semibold mb-2 flex items-center text-lightblue-900">
              <Layers className="h-5 w-5 mr-2 text-lightblue-500" />
              Stake dETH
            </h2>
            <p className="text-lightblue-700 mb-6">Stake your dETH tokens and receive sETH tokens.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-lightblue-900">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="input-amount pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm font-medium text-lightblue-700">dETH</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-lightblue-700">
                    Available: {Number.parseFloat(dETHBalance).toFixed(4)} dETH
                  </span>
                  <button onClick={setMaxStake} className="text-lightblue-500 hover:underline">
                    Max
                  </button>
                </div>
              </div>

              {Number.parseFloat(allowance) <= 0 && (
                <Alert className="bg-lightblue-50 border-lightblue-200 text-lightblue-800">
                  <AlertCircle className="h-4 w-4 text-lightblue-500" />
                  <AlertDescription className="font-medium">
                    You need to approve dETH tokens before staking. This is a one-time approval.
                  </AlertDescription>
                </Alert>
              )}

              {Number.parseFloat(allowance) <= 0 ? (
                <Button
                  onClick={handleApprove}
                  disabled={isApproving || isCheckingAllowance}
                  className="primary-button"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : isCheckingAllowance ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Approve dETH"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleStake}
                  disabled={
                    !stakeAmount ||
                    isStaking ||
                    Number.parseFloat(stakeAmount) <= 0 ||
                    Number.parseFloat(allowance) <= 0
                  }
                  className="primary-button"
                >
                  {isStaking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Staking...
                    </>
                  ) : (
                    <>
                      <Layers className="mr-2 h-4 w-4" />
                      Stake dETH
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="unstake" className="animate-slide-in">
          <div className="action-card">
            <h2 className="text-xl font-semibold mb-2 flex items-center text-lightblue-900">
              <ArrowUpFromLine className="h-5 w-5 mr-2 text-lightblue-500" />
              Unstake sETH
            </h2>
            <p className="text-lightblue-700 mb-6">Unstake your sETH tokens and receive dETH tokens.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-lightblue-900">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="input-amount pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm font-medium text-lightblue-700">sETH</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-lightblue-700">
                    Available: {Number.parseFloat(sETHBalance).toFixed(4)} sETH
                  </span>
                  <button onClick={setMaxUnstake} className="text-lightblue-500 hover:underline">
                    Max
                  </button>
                </div>
              </div>

              <Button
                onClick={handleUnstake}
                disabled={!unstakeAmount || isUnstaking || Number.parseFloat(unstakeAmount) <= 0}
                className="primary-button"
              >
                {isUnstaking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Unstaking...
                  </>
                ) : (
                  <>
                    <ArrowUpFromLine className="mr-2 h-4 w-4" />
                    Unstake sETH
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
