"use client"

import React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StakingDashboard } from "@/components/staking-dashboard"
import { DepositWithdraw } from "@/components/deposit-withdraw"
import { StakeUnstake } from "@/components/stake-unstake"
import { Leaderboard } from "@/components/leaderboard"
import Governance from "@/components/governance"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileTabs() {
  const [scrollPosition, setScrollPosition] = useState(0)
  const tabsRef = React.useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: -100, behavior: "smooth" })
      setScrollPosition(tabsRef.current.scrollLeft - 100)
    }
  }

  const scrollRight = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: 100, behavior: "smooth" })
      setScrollPosition(tabsRef.current.scrollLeft + 100)
    }
  }

  return (
    <div className="relative w-full">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 md:hidden">
        <Button variant="ghost" size="icon" onClick={scrollLeft} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <div className="relative overflow-hidden">
          <TabsList
            ref={tabsRef}
            className="flex w-full mb-6 overflow-x-auto scrollbar-hide snap-x"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <TabsTrigger value="dashboard" className="text-xs whitespace-nowrap flex-shrink-0 snap-start">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="deposit" className="text-xs whitespace-nowrap flex-shrink-0 snap-start">
              Deposit/Withdraw
            </TabsTrigger>
            <TabsTrigger value="stake" className="text-xs whitespace-nowrap flex-shrink-0 snap-start">
              Stake/Unstake
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs whitespace-nowrap flex-shrink-0 snap-start">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="governance" className="text-xs whitespace-nowrap flex-shrink-0 snap-start">
              Governance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard">
          <StakingDashboard />
        </TabsContent>
        <TabsContent value="deposit">
          <DepositWithdraw />
        </TabsContent>
        <TabsContent value="stake">
          <StakeUnstake />
        </TabsContent>
        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>
        <TabsContent value="governance">
          <Governance />
        </TabsContent>
      </Tabs>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 md:hidden">
        <Button variant="ghost" size="icon" onClick={scrollRight} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
