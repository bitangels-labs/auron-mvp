"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useWeb3 } from "@/components/web3-provider"
import { Button } from "@/components/ui/button"
import { Menu, X, Wallet, LogOut, ChevronDown, ExternalLink, Copy, Check, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { AuronLogo } from "@/components/auron-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SEPOLIA_EXPLORER } from "@/lib/contracts"

export function Navbar() {
  const pathname = usePathname()
  const {
    account,
    openWalletModal,
    disconnectWallet,
    isConnected,
    networkName,
    refreshBalances,
    connectedWalletId,
    ethBalance,
    dETHBalance,
    sETHBalance,
  } = useWeb3()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Deposit", href: "/deposit" },
    { name: "Stake", href: "/stake" },
    { name: "Rewards", href: "/rewards" },
    { name: "History", href: "/history" },
    { name: "Analytics", href: "/analytics" },
    { name: "Governance", href: "/governance" },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const formatBalance = (balance: string) => {
    return Number.parseFloat(balance).toFixed(4)
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <>
      <nav
        className={`navbar fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? "scrolled" : ""}`}
      >
        <div className="container mx-auto px-4 py-3">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center gap-2">
                <AuronLogo size="sm" />
              </Link>

              <div className="hidden md:flex items-center space-x-1 overflow-x-auto max-w-[52vw] lg:max-w-none">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`navbar-link px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                      pathname === item.href ? "active" : ""
                    }`}
                  >
                    {item.name}
                    {pathname === item.href && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full"></span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              {isConnected ? (
                <div className="flex items-center space-x-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="hidden lg:flex items-center space-x-3 bg-lightblue-50 px-4 py-2 rounded-lg">
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-lightblue-500 hover:text-lightblue-700"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Your wallet balances</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-lightblue-200 bg-white hover:bg-lightblue-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800">
                        <div className="flex items-center">
                          <div className="flex items-center mr-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            <span className="hidden md:inline-block font-medium">
                              {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : ""}
                            </span>
                            <span className="md:hidden">Account</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-lightblue-500" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                      <DropdownMenuLabel className="flex items-center justify-between">
                        <span>Connected Wallet</span>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                          {connectedWalletId ? networkName : "Connected"}
                        </Badge>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      <div className="px-2 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-lightblue-700">Address</span>
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-lightblue-500 hover:text-lightblue-700"
                              onClick={copyAddress}
                            >
                              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            <a
                              href={`${SEPOLIA_EXPLORER}/address/${account}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-6 w-6 flex items-center justify-center text-lightblue-500 hover:text-lightblue-700"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                        <div className="bg-lightblue-50 p-2 rounded-md text-sm font-mono mb-3">
                          {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : ""}
                        </div>

                        <div className="space-y-1 text-sm text-lightblue-700">
                          <div className="flex justify-between">
                            <span>ETH</span>
                            <span className="font-medium">{formatBalance(ethBalance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>dETH</span>
                            <span className="font-medium">{formatBalance(dETHBalance)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>sETH</span>
                            <span className="font-medium">{formatBalance(sETHBalance)}</span>
                          </div>
                        </div>
                      </div>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={disconnectWallet}
                        className="cursor-pointer text-red-500 focus:text-red-500"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect Wallet
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button onClick={openWalletModal} className="connect-button">
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <AuronLogo size="sm" showText={true} className="flex" />
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isConnected ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white text-lightblue-700 border-lightblue-200 dark:bg-slate-900 dark:border-slate-700">
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Account</span>
                      <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-500 border-green-500 text-xs">
                        Connected
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Wallet Balances</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={disconnectWallet} className="cursor-pointer text-red-500">
                      <LogOut className="mr-2 h-4 w-4" />
                      Disconnect Wallet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={openWalletModal} size="sm" className="connect-button">
                  Connect Wallet
                </Button>
              )}

              <button className="navbar-mobile-trigger" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu animate-fade-in">
          <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <X className="h-6 w-6" />
          </button>
          <div className="mobile-menu-links">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-slate-700 hover:text-brand dark:text-slate-300 dark:hover:text-indigo-400 ${pathname === item.href ? "font-bold text-brand dark:text-indigo-400" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {!isConnected && (
              <Button
                onClick={() => {
                  openWalletModal()
                  setMobileMenuOpen(false)
                }}
                className="mt-4 connect-button"
              >
                Connect Wallet
              </Button>
            )}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-sm text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden under the navbar */}
      <div className="h-14"></div>
    </>
  )
}
