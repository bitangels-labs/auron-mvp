export type WalletId = "metamask" | "rabby" | "phantom" | "tron"

export type WalletOption = {
  id: WalletId
  name: string
  description: string
  installUrl: string
  supported: boolean
}

export const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Connect via the MetaMask browser extension",
    installUrl: "https://metamask.io/download/",
    supported: true,
  },
  {
    id: "rabby",
    name: "Rabby",
    description: "Connect via the Rabby browser extension",
    installUrl: "https://rabby.io/",
    supported: true,
  },
  {
    id: "phantom",
    name: "Phantom",
    description: "Connect via Phantom's Ethereum account",
    installUrl: "https://phantom.app/download",
    supported: true,
  },
  {
    id: "tron",
    name: "TronLink",
    description: "Connect via the TronLink browser extension",
    installUrl: "https://www.tronlink.org/",
    supported: true,
  },
]

const STORAGE_KEY = "auron_wallet_id"

const PROVIDER_DISCOVERY_EVENTS = ["eip6963:announceProvider", "TIP6963:announceProvider"] as const
const PROVIDER_REQUEST_EVENTS = ["eip6963:requestProvider", "TIP6963:requestProvider"] as const

export function getStoredWalletId(): WalletId | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "metamask" || stored === "rabby" || stored === "phantom" || stored === "tron") {
    return stored
  }
  return null
}

export function setStoredWalletId(walletId: WalletId | null) {
  if (typeof window === "undefined") return
  if (walletId) {
    localStorage.setItem(STORAGE_KEY, walletId)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export async function discoverEip6963Providers(): Promise<EIP6963ProviderDetail[]> {
  if (typeof window === "undefined") return []

  return new Promise((resolve) => {
    const providers: EIP6963ProviderDetail[] = []

    const handler = (event: Event) => {
      const detail = (event as EIP6963AnnounceProviderEvent).detail
      if (detail?.provider) {
        const exists = providers.some((item) => item.info.uuid === detail.info.uuid)
        if (!exists) providers.push(detail)
      }
    }

    for (const eventName of PROVIDER_DISCOVERY_EVENTS) {
      window.addEventListener(eventName, handler)
    }

    for (const eventName of PROVIDER_REQUEST_EVENTS) {
      window.dispatchEvent(new Event(eventName))
    }

    setTimeout(() => {
      for (const eventName of PROVIDER_DISCOVERY_EVENTS) {
        window.removeEventListener(eventName, handler)
      }
      resolve(providers)
    }, 300)
  })
}

function findAnnouncedProvider(rdns: string, announced: EIP6963ProviderDetail[]) {
  return announced.find((item) => item.info.rdns === rdns)?.provider ?? null
}

function findTronLinkAnnouncedProvider(announced: EIP6963ProviderDetail[]) {
  const match = announced.find(
    (item) =>
      item.info.name === "TronLink" ||
      item.info.rdns === "com.tronlink" ||
      item.info.rdns.includes("tronlink"),
  )
  return match?.provider ?? null
}

function getInjectedTronLinkProvider(): EIP1193Provider | null {
  if (window.tron?.request) return window.tron
  if (window.tronLink?.request) return window.tronLink
  return null
}

async function getTronLinkProvider(): Promise<EIP1193Provider | null> {
  const announced = await discoverEip6963Providers()
  return findTronLinkAnnouncedProvider(announced) ?? getInjectedTronLinkProvider()
}

export async function getWalletProvider(walletId: WalletId): Promise<EIP1193Provider | null> {
  if (walletId === "tron") {
    return getTronLinkProvider()
  }

  const announced = await discoverEip6963Providers()

  switch (walletId) {
    case "metamask": {
      const announcedMetaMask = findAnnouncedProvider("io.metamask", announced)
      if (announcedMetaMask) return announcedMetaMask
      if (window.ethereum?.isMetaMask && !window.ethereum?.isRabby) return window.ethereum
      return null
    }
    case "rabby": {
      const announcedRabby = findAnnouncedProvider("io.rabby", announced)
      if (announcedRabby) return announcedRabby
      if (window.ethereum?.isRabby) return window.ethereum
      return null
    }
    case "phantom": {
      const announcedPhantom = findAnnouncedProvider("app.phantom", announced)
      if (announcedPhantom) return announcedPhantom
      return window.phantom?.ethereum ?? null
    }
    default:
      return null
  }
}

export async function isWalletInstalled(walletId: WalletId): Promise<boolean> {
  return Boolean(await getWalletProvider(walletId))
}

export function getWalletLabel(walletId: WalletId | null) {
  if (!walletId) return ""
  return WALLET_OPTIONS.find((wallet) => wallet.id === walletId)?.name ?? walletId
}

const WALLET_INSTALL_URLS: Record<WalletId, string> = {
  metamask: "https://metamask.io/download/",
  rabby: "https://rabby.io/",
  phantom: "https://phantom.app/download",
  tron: "https://www.tronlink.org/",
}

export function getWalletInstallUrl(walletId: WalletId) {
  return WALLET_INSTALL_URLS[walletId]
}
