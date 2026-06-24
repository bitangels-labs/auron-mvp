"use client"

import { useEffect, useState } from "react"
import { ethers } from "ethers"
import { useWeb3 } from "@/components/web3-provider"
import { Button } from "@/components/ui/button"
import { BarChart3, RefreshCw, Users, Layers } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"

export function AnalyticsReport() {
  const { stakingDashboardContract, ethBalance, dETHBalance, sETHBalance, isConnected, refreshBalances } = useWeb3()
  const [overview, setOverview] = useState({
    totalETHDeposited: "0",
    totalETHStaked: "0",
    totalStakers: "0",
    averageStakeAmount: "0",
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAnalytics = async () => {
    if (!stakingDashboardContract) return
    try {
      setLoading(true)
      const data = await stakingDashboardContract.getStakingOverview()
      setOverview({
        totalETHDeposited: ethers.formatEther(data.totalETHDeposited),
        totalETHStaked: ethers.formatEther(data.totalETHStaked),
        totalStakers: data.totalStakers.toString(),
        averageStakeAmount: ethers.formatEther(data.averageStakeAmount),
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [stakingDashboardContract])

  const handleRefresh = async () => {
    setRefreshing(true)
    if (isConnected) await refreshBalances()
    await loadAnalytics()
    setTimeout(() => setRefreshing(false), 800)
  }

  const protocolData = [
    { name: "Deposited", value: Number.parseFloat(overview.totalETHDeposited) },
    { name: "Staked", value: Number.parseFloat(overview.totalETHStaked) },
    {
      name: "Liquid",
      value: Math.max(
        0,
        Number.parseFloat(overview.totalETHDeposited) - Number.parseFloat(overview.totalETHStaked),
      ),
    },
  ]

  const userAllocation = isConnected
    ? [
        { name: "ETH", value: Number.parseFloat(ethBalance), fill: "#4F46E5" },
        { name: "dETH", value: Number.parseFloat(dETHBalance), fill: "#6366F1" },
        { name: "sETH", value: Number.parseFloat(sETHBalance), fill: "#A5B4FC" },
      ].filter((item) => item.value > 0)
    : []

  const stakingRate =
    Number.parseFloat(overview.totalETHDeposited) > 0
      ? (
          (Number.parseFloat(overview.totalETHStaked) / Number.parseFloat(overview.totalETHDeposited)) *
          100
        ).toFixed(1)
      : "0"

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Analytics & Reporting</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-lightblue-700">Total Deposited</h3>
            <BarChart3 className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">
            {Number.parseFloat(overview.totalETHDeposited).toFixed(2)}
          </div>
          <div className="text-sm text-lightblue-600">ETH</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-lightblue-700">Staking Rate</h3>
            <Layers className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">{stakingRate}%</div>
          <div className="text-sm text-lightblue-600">of deposits staked</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-lightblue-700">Active Stakers</h3>
            <Users className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">{overview.totalStakers}</div>
          <div className="text-sm text-lightblue-600">
            Avg. {Number.parseFloat(overview.averageStakeAmount).toFixed(4)} ETH
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h2 className="section-title mb-4">Protocol TVL Breakdown</h2>
          {loading ? (
            <p className="text-lightblue-700">Loading chart...</p>
          ) : (
            <ChartContainer
              config={{
                Deposited: { label: "Deposited", color: "#4F46E5" },
                Staked: { label: "Staked", color: "#4338CA" },
                Liquid: { label: "Liquid", color: "#C7D2FE" },
              }}
              className="h-[260px] w-full"
            >
              <BarChart data={protocolData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={8}>
                  {protocolData.map((entry, index) => (
                    <Cell key={entry.name} fill={["#4F46E5", "#4338CA", "#C7D2FE"][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="stat-card">
          <h2 className="section-title mb-4">Your Allocation</h2>
          {!isConnected ? (
            <p className="text-lightblue-700">Connect your wallet to see personal allocation analytics.</p>
          ) : userAllocation.length === 0 ? (
            <p className="text-lightblue-700">No holdings to display yet.</p>
          ) : (
            <ChartContainer
              config={{
                ETH: { label: "ETH", color: "#4F46E5" },
                dETH: { label: "dETH", color: "#6366F1" },
                sETH: { label: "sETH", color: "#A5B4FC" },
              }}
              className="h-[260px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={userAllocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                  {userAllocation.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </div>
  )
}
