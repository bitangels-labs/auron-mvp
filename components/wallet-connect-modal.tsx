"use client"

import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { WALLET_OPTIONS, type WalletId } from "@/lib/wallets"
import { cn } from "@/lib/utils"

type WalletConnectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectWallet: (walletId: WalletId) => Promise<void>
  connectingWalletId: WalletId | null
}

const WALLET_ICONS: Record<WalletId, string> = {
  metamask: "/wallets/metamask.svg",
  rabby: "/wallets/rabby.svg",
  phantom: "/wallets/phantom.svg",
  tron: "/wallets/tron.svg",
}

export function WalletConnectModal({
  open,
  onOpenChange,
  onSelectWallet,
  connectingWalletId,
}: WalletConnectModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-6 border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-[420px] sm:rounded-2xl">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            Connect with MetaMask, Rabby, Phantom, or TronLink. Auron uses Ethereum (Sepolia) — approve the connection
            and switch network when prompted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {WALLET_OPTIONS.map((wallet) => {
            const isConnecting = connectingWalletId === wallet.id

            return (
              <button
                key={wallet.id}
                type="button"
                disabled={isConnecting}
                onClick={() => onSelectWallet(wallet.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-4 rounded-xl border bg-white px-5 py-4 text-left transition-colors",
                  "border-gray-200 dark:border-slate-700 dark:bg-slate-800/50",
                  "hover:border-brand hover:bg-brand-light dark:hover:bg-indigo-950/60",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                )}
              >
                <Image
                  src={WALLET_ICONS[wallet.id]}
                  alt={`${wallet.name} logo`}
                  width={36}
                  height={36}
                  className={cn(
                    "h-9 w-9 shrink-0 object-contain",
                    wallet.id === "metamask" ? "rounded-none" : "rounded-lg",
                  )}
                />
                <span className="flex-1 text-lg font-bold text-gray-900 dark:text-slate-100">{wallet.name}</span>
                {isConnecting && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand" />}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
