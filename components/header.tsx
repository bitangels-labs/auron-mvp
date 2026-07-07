"use client"

import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/web3-provider"
import { MoonIcon, SunIcon, RefreshCw } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useState } from "react"

export function Header() {
  const { account, openWalletModal, isConnected, ethBalance, dETHBalance, sETHBalance, refreshBalances, networkName } =
    useWeb3()
  const { theme, setTheme } = useTheme()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image src="/ethereal-threads.png" alt="ETH Staking Logo" width={40} height={40} className="rounded-full" />
          <h1 className="text-xl font-bold">ETH Staking & Governance</h1>
        </div>

        <div className="flex items-center space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <div className="hidden md:flex flex-col text-right text-sm">
                <span className="text-gray-400">ETH: {Number.parseFloat(ethBalance).toFixed(4)}</span>
                <span className="text-gray-400">dETH: {Number.parseFloat(dETHBalance).toFixed(4)}</span>
                <span className="text-gray-400">sETH: {Number.parseFloat(sETHBalance).toFixed(4)}</span>
              </div>
              <div className="flex flex-col items-end">
                <Button variant="outline" size="sm">
                  {account?.substring(0, 6)}...{account?.substring(38)}
                </Button>
                <span className="text-xs text-green-500 mt-1">Connected</span>
              </div>
            </div>
          ) : (
            <Button onClick={openWalletModal}>Connect Wallet</Button>
          )}

          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
