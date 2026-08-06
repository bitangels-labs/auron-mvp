"use client"

import { useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { ethers } from "ethers"
import { Wallet, Layers, Users, BarChart3, ArrowDownToLine, ArrowUpFromLine, RefreshCw, TrendingUp, History, Gift } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function StakingDashboard() {
  const { stakingDashboardContract, isConnected, account, refreshBalances, ethBalance, dETHBalance, sETHBalance } =
    useWeb3()
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [overview, setOverview] = useState({
    totalETHDeposited: "0",
    totalETHStaked: "0",
    totalStakers: "0",
    averageStakeAmount: "0",
  })
  const [userStats, setUserStats] = useState({
    stakedAmount: "0",
    stakingTimestamp: "0",
    rank: "0",
    percentageOfTotal: "0",
  })

  const fetchData = async () => {
    if (stakingDashboardContract) {
      try {
        setLoading(true)

        // Get staking overview
        const overviewData = await stakingDashboardContract.getStakingOverview()
        setOverview({
          totalETHDeposited: ethers.formatEther(overviewData.totalETHDeposited),
          totalETHStaked: ethers.formatEther(overviewData.totalETHStaked),
          totalStakers: overviewData.totalStakers.toString(),
          averageStakeAmount: ethers.formatEther(overviewData.averageStakeAmount),
        })

        // Get user stats if connected
        if (account) {
          const userStatsData = await stakingDashboardContract.getStakerDetails(account)
          setUserStats({
            stakedAmount: ethers.formatEther(userStatsData.stakedAmount),
            stakingTimestamp: new Date(Number(userStatsData.stakingTimestamp) * 1000).toLocaleDateString(),
            rank: userStatsData.rank.toString(),
            percentageOfTotal: (Number(userStatsData.percentageOfTotal) / 100).toFixed(2),
          })
        }
      } catch (error) {
        console.error("Error fetching staking data:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [stakingDashboardContract, account, isConnected])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshBalances()
    await fetchData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-white text-lightblue-600 border-lightblue-200 hover:bg-lightblue-50 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-lightblue-700">Available Balance</h3>
            <Wallet className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">{Number.parseFloat(dETHBalance).toFixed(4)}</div>
          <div className="text-sm font-medium text-lightblue-600">dETH</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-lightblue-700">Staked Balance</h3>
            <Layers className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">{Number.parseFloat(sETHBalance).toFixed(4)}</div>
          <div className="text-sm font-medium text-lightblue-600">sETH</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-lightblue-700">Total Protocol Staked</h3>
            <BarChart3 className="h-5 w-5 text-lightblue-500" />
          </div>
          <div className="text-2xl font-bold text-lightblue-950">
            {Number.parseFloat(overview.totalETHStaked).toFixed(2)}
          </div>
          <div className="text-sm font-medium text-lightblue-600">ETH</div>
        </div>
      </div>

      {isConnected && account && (
        <>
          <h2 className="section-title">Your Position</h2>
          <div className="stat-card mb-8">
            {loading ? (
              <p className="text-lightblue-700">Loading your position...</p>
            ) : Number.parseFloat(userStats.stakedAmount) > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-lightblue-600 mb-1">Staked</p>
                  <p className="text-lg font-semibold text-lightblue-950">
                    {Number.parseFloat(userStats.stakedAmount).toFixed(4)} sETH
                  </p>
                </div>
                <div>
                  <p className="text-sm text-lightblue-600 mb-1">Since</p>
                  <p className="text-lg font-semibold text-lightblue-950">{userStats.stakingTimestamp}</p>
                </div>
                <div>
                  <p className="text-sm text-lightblue-600 mb-1">Rank</p>
                  <p className="text-lg font-semibold text-lightblue-950">
                    {userStats.rank === "0" ? "Unranked" : `#${userStats.rank}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-lightblue-600 mb-1">Protocol Share</p>
                  <p className="text-lg font-semibold text-lightblue-950">{userStats.percentageOfTotal}%</p>
                </div>
              </div>
            ) : (
              <p className="text-lightblue-700">
                No active stake yet.{" "}
                <Link href="/stake" className="text-lightblue-600 font-medium hover:underline">
                  Stake dETH
                </Link>{" "}
                to open a position.
              </p>
            )}
          </div>
        </>
      )}

      <h2 className="section-title">Product Hub</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/portfolio" className="action-button">
          <TrendingUp className="h-5 w-5" />
          Portfolio
        </Link>
        <Link href="/rewards" className="action-button">
          <Gift className="h-5 w-5" />
          Rewards
        </Link>
        <Link href="/history" className="action-button">
          <History className="h-5 w-5" />
          History
        </Link>
        <Link href="/analytics" className="action-button">
          <BarChart3 className="h-5 w-5" />
          Analytics
        </Link>
      </div>

      {/* Actions */}
      <h2 className="section-title">Actions</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/deposit" className="action-button">
          <ArrowDownToLine className="h-5 w-5" />
          Deposit
        </Link>
        <Link href="/deposit?tab=withdraw" className="action-button">
          <ArrowUpFromLine className="h-5 w-5" />
          Withdraw
        </Link>
        <Link href="/stake" className="action-button">
          <Layers className="h-5 w-5" />
          Stake
        </Link>
        <Link href="/stake?tab=unstake" className="action-button">
          <ArrowUpFromLine className="h-5 w-5" />
          Unstake
        </Link>
      </div>

      {/* Total Stakers */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-lightblue-700">Total Stakers</h3>
          <Users className="h-5 w-5 text-lightblue-500" />
        </div>
        <div className="text-2xl font-bold text-lightblue-950">{overview.totalStakers}</div>
        <div className="text-sm text-lightblue-700 mt-2">
          Average stake: {Number.parseFloat(overview.averageStakeAmount).toFixed(4)} ETH
        </div>
      </div>
    </div>
  )
}
