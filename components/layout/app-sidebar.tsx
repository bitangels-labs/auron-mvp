"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useWeb3 } from "@/components/web3-provider"
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trophy,
  Vote,
  Wallet,
  ExternalLink,
  Github,
} from "lucide-react"
import { AuronLogo } from "@/components/auron-logo"
import { SEPOLIA_EXPLORER } from "@/lib/contracts"

export function AppSidebar() {
  const pathname = usePathname()
  const { isConnected, account } = useWeb3()

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      current: pathname === "/",
    },
    {
      name: "Deposit & Withdraw",
      href: "/deposit",
      icon: ArrowDownToLine,
      current: pathname === "/deposit",
    },
    {
      name: "Stake & Unstake",
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
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="border-b pb-2">
        <Link href="/" className="flex items-center gap-2 px-2">
          <AuronLogo size="sm" showText={true} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={item.current} tooltip={item.name}>
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t pt-2">
        <SidebarMenu>
          {isConnected && account && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Your Wallet">
                <Link
                  href={`${SEPOLIA_EXPLORER}/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Wallet className="h-5 w-5" />
                  <span className="truncate">
                    {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : ""}
                  </span>
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="GitHub">
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
                <span>GitHub</span>
                <ExternalLink className="ml-auto h-4 w-4" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger className="absolute bottom-4 right-4 md:hidden" />
      </SidebarFooter>
    </Sidebar>
  )
}
