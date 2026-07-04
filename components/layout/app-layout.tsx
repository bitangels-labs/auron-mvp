"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useWeb3 } from "@/components/web3-provider"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, MoonIcon, SunIcon } from "lucide-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { account, openWalletModal, isConnected, ethBalance, dETHBalance, sETHBalance, refreshBalances, networkName } =
    useWeb3()
  const { theme, setTheme } = useTheme()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const formatBalance = (balance: string) => {
    return Number.parseFloat(balance).toFixed(4)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2 md:hidden">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/ethereal-threads.png"
                    alt="ETH Staking Logo"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="font-semibold">ETH Staking</span>
                </Link>
              </div>

              <div className="flex items-center gap-4">
                {isConnected ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <span className="hidden md:inline-block">
                            {account?.substring(0, 6)}...{account?.substring(38)}
                          </span>
                          <span className="md:hidden">Account</span>
                          <Badge
                            variant="outline"
                            className="ml-2 bg-green-500/20 text-green-500 border-green-500 text-xs"
                          >
                            Connected
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Wallet Balances</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">ETH:</span>
                            <span className="font-medium">{formatBalance(ethBalance)}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">dETH:</span>
                            <span className="font-medium">{formatBalance(dETHBalance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">sETH:</span>
                            <span className="font-medium">{formatBalance(sETHBalance)}</span>
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing} className="cursor-pointer">
                          {isRefreshing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Refresh Balances
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <Button onClick={openWalletModal} size="sm">
                    Connect Wallet
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {mounted && theme === "dark" ? (
                    <SunIcon className="h-[1.2rem] w-[1.2rem]" />
                  ) : (
                    <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="container py-6 md:py-8 px-4">
              {!isConnected && pathname !== "/" ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center">
                  <Image
                    src="/ethereal-threads.png"
                    alt="ETH Staking Logo"
                    width={80}
                    height={80}
                    className="rounded-full mb-6"
                  />
                  <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                  <p className="text-muted-foreground mb-6">
                    Please connect your wallet to access the ETH staking and governance features.
                  </p>
                  <Button onClick={openWalletModal} size="lg">
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                children
              )}
            </div>
          </main>

          <footer className="border-t py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 text-center md:text-left">
              <div className="text-sm text-muted-foreground">
                <p>ETH Staking & Governance Platform</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/deposit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Deposit
                </Link>
                <Link href="/stake" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Stake
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}
