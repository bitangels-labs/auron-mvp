"use client"

import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { Wallet } from "lucide-react"

type ConnectPromptProps = {
  title?: string
  description?: string
}

export function ConnectPrompt({
  title = "Connect Your Wallet",
  description = "Choose MetaMask, Rabby, Phantom, or TronLink to view your positions, rewards, and transaction history.",
}: ConnectPromptProps) {
  const { openWalletModal } = useWeb3()

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md">
        <Wallet className="h-12 w-12 text-brand mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{description}</p>
        <Button onClick={openWalletModal} className="connect-button w-full">
          Connect Wallet
        </Button>
      </div>
    </div>
  )
}
