interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
  removeAllListeners?: () => void
  isMetaMask?: boolean
  isRabby?: boolean
}

interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: EIP1193Provider
}

interface EIP6963AnnounceProviderEvent extends Event {
  detail: EIP6963ProviderDetail
}

interface PhantomEthereumProvider extends EIP1193Provider {
  isPhantom?: boolean
}

interface Window {
  ethereum?: EIP1193Provider
  phantom?: {
    ethereum?: PhantomEthereumProvider
  }
  tron?: EIP1193Provider & {
    isTronLink?: boolean
    tronWeb?: unknown
  }
  tronLink?: EIP1193Provider & {
    ready?: boolean
    tronWeb?: unknown
  }
}
