"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ethers } from "ethers"
import { useWeb3 } from "@/components/web3-provider"
import { ConnectPrompt } from "@/components/connect-prompt"
import { Button } from "@/components/ui/button"
import { fetchStakingPosition, type StakingPosition } from "@/lib/staking-data"
import { Layers, RefreshCw, Wallet, PieChart, ArrowRight } from "lucide-react"

export function PortfolioView() {
  const { isConnected, account, ethBalance, dETHBalance, sETHBalance, stakingDashboardContract, refreshBalances } =
    useWeb3()
  const [position, setPosition] = useState<StakingPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const eth = Number.parseFloat(ethBalance)
  const dETH = Number.parseFloat(dETHBalance)
  const sETH = Number.parseFloat(sETHBalance)
  const totalEthEquivalent = eth + dETH + sETH
  const liquidPct = totalEthEquivalent > 0 ? ((eth + dETH) / totalEthEquivalent) * 100 : 0
  const stakedPct = totalEthEquivalent > 0 ? (sETH / totalEthEquivalent) * 100 : 0

  const loadData = async () => {
    if (!stakingDashboardContract || !account) return
    try {
      setLoading(true)
      const data = await fetchStakingPosition(stakingDashboardContract, account)
      setPosition(data)
    } catch (error) {
      console.error("Error loading portfolio:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && account) {
      loadData()
    }
  }, [isConnected, account, stakingDashboardContract])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshBalances()
    await loadData()
    setTimeout(() => setRefreshing(false), 800)
  }

  if (!isConnected) {
    return (
      <ConnectPrompt
        title="Portfolio"
        description="Connect your wallet to manage positions, review allocation, and track your staking exposure."
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Portfolio</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-lightblue-700">Total Value</h3>
            <PieChart className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">{totalEthEquivalent.toFixed(4)}</div>
          <div className="text-sm text-lightblue-600">ETH equivalent</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-lightblue-700">Liquid</h3>
            <Wallet className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">{(eth + dETH).toFixed(4)}</div>
          <div className="text-sm text-lightblue-600">{liquidPct.toFixed(1)}% of portfolio</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-lightblue-700">Staked</h3>
            <Layers className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">{sETH.toFixed(4)}</div>
          <div className="text-sm text-lightblue-600">{stakedPct.toFixed(1)}% of portfolio</div>
        </div>
      </div>

      <h2 className="section-title">Position Management</h2>
      <div className="stat-card mb-8">
        {loading ? (
          <p className="text-lightblue-700">Loading position...</p>
        ) : position && Number.parseFloat(position.stakedAmount) > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-lightblue-600 mb-1">Staked Amount</p>
              <p className="text-lg font-semibold text-lightblue-950">
                {Number.parseFloat(position.stakedAmount).toFixed(4)} sETH
              </p>
            </div>
            <div>
              <p className="text-sm text-lightblue-600 mb-1">Staking Since</p>
              <p className="text-lg font-semibold text-lightblue-950">
                {position.stakingTimestamp > 0
                  ? new Date(position.stakingTimestamp * 1000).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-lightblue-600 mb-1">Duration</p>
              <p className="text-lg font-semibold text-lightblue-950">{position.daysStaked} days</p>
            </div>
            <div>
              <p className="text-sm text-lightblue-600 mb-1">Leaderboard Rank</p>
              <p className="text-lg font-semibold text-lightblue-950">
                {position.rank === "0" ? "Unranked" : `#${position.rank}`}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-lightblue-600 mb-1">Share of Protocol</p>
              <p className="text-lg font-semibold text-lightblue-950">{position.percentageOfTotal}%</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-lightblue-700">No active staking position. Deposit ETH and stake dETH to open a position.</p>
            <Link href="/stake">
              <Button>
                Start Staking
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      <h2 className="section-title">Holdings Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-sm text-lightblue-600 mb-1">ETH (wallet)</p>
          <p className="text-xl font-bold text-lightblue-950">{eth.toFixed(4)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-lightblue-600 mb-1">dETH (liquid staking token)</p>
          <p className="text-xl font-bold text-lightblue-950">{dETH.toFixed(4)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-lightblue-600 mb-1">sETH (staked position)</p>
          <p className="text-xl font-bold text-lightblue-950">{sETH.toFixed(4)}</p>
        </div>
      </div>
    </div>
  )
}
