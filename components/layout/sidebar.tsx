"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useWeb3 } from "@/components/web3-provider"
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, Trophy, Vote, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuronLogo } from "@/components/auron-logo"

export function Sidebar() {
  const pathname = usePathname()
  const { account, isConnected, disconnectWallet } = useWeb3()

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      current: pathname === "/",
    },
    {
      name: "Deposit/Withdraw",
      href: "/deposit",
      icon: ArrowDownToLine,
      current: pathname === "/deposit",
    },
    {
      name: "Stake/Unstake",
      href: "/stake",
      icon: ArrowUpFromLine,
      current: pathname === "/stake",
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      current: pathname === "/leaderboard",
    },
    {
      name: "Governance",
      href: "/governance",
      icon: Vote,
      current: pathname === "/governance",
    },
  ]

  return (
    <div className="sidebar">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3">
          <AuronLogo />
        </Link>
      </div>

      <nav className="mt-6">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href} className={`sidebar-item ${item.current ? "active" : ""}`}>
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {isConnected && account && (
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-lightblue-200 bg-white">
          <div className="flex items-center gap-2 px-2 py-2 text-xs text-lightblue-600 bg-lightblue-50 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span className="truncate">
              {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : ""}
            </span>
          </div>
          <Button
            variant="ghost"
            className="w-full mt-2 text-lightblue-600 hover:text-lightblue-700 hover:bg-lightblue-50"
            onClick={disconnectWallet}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </div>
      )}
    </div>
  )
}
