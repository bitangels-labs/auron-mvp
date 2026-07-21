"use client"

import type React from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { AuronLogo } from "@/components/auron-logo"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { openWalletModal, isConnected } = useWeb3()
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex min-h-screen bg-lightblue-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowMobileSidebar(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 text-slate-900">
          <Button variant="ghost" size="icon" onClick={() => setShowMobileSidebar(true)} className="text-slate-700 hover:text-brand">
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <AuronLogo size="sm" />
          </div>
          <div className="w-6"></div> {/* Spacer for alignment */}
        </header>

        {/* Content */}
        <main className="p-4 md:p-8">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-md mx-auto text-center">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-lightblue-100 mb-6">
                <AuronLogo size="lg" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-lightblue-950">Connect Your Wallet</h2>
              <p className="text-lightblue-700 mb-6">
                Connect with MetaMask, Rabby, Phantom, or TronLink to access Auron staking and governance.
              </p>
              <Button onClick={openWalletModal} size="lg" className="connect-button">
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="page-container">{children}</div>
          )}
        </main>
      </div>
    </div>
  )
}
