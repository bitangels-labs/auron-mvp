"use client"

import { useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { ConnectPrompt } from "@/components/connect-prompt"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  buildRewardSummary,
  fetchStakingPosition,
  getClaimedRewards,
  setClaimedRewards,
  type RewardSummary,
} from "@/lib/staking-data"
import { useToast } from "@/components/ui/use-toast"
import { Gift, RefreshCw, Info } from "lucide-react"

export function RewardsTracker() {
  const { isConnected, account, stakingDashboardContract, refreshBalances } = useWeb3()
  const [summary, setSummary] = useState<RewardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const { toast } = useToast()

  const loadRewards = async () => {
    if (!stakingDashboardContract || !account) return
    try {
      setLoading(true)
      const position = await fetchStakingPosition(stakingDashboardContract, account)
      setSummary(buildRewardSummary(position, account))
    } catch (error) {
      console.error("Error loading rewards:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && account) {
      loadRewards()
    }
  }, [isConnected, account, stakingDashboardContract])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshBalances()
    await loadRewards()
    setTimeout(() => setRefreshing(false), 800)
  }

  const handleClaim = async () => {
    if (!account || !summary) return
    const claimable = Number.parseFloat(summary.claimableRewards)
    if (claimable <= 0) {
      toast({ title: "Nothing to claim", description: "No claimable rewards at this time." })
      return
    }

    setClaiming(true)
    try {
      const newClaimed = getClaimedRewards(account) + claimable
      setClaimedRewards(account, newClaimed)
      await loadRewards()
      toast({
        title: "Rewards Claimed",
        description: `${claimable.toFixed(6)} ETH equivalent recorded. On-chain distribution will activate with the Rewards contract upgrade.`,
      })
    } finally {
      setClaiming(false)
    }
  }

  if (!isConnected) {
    return (
      <ConnectPrompt
        title="Rewards"
        description="Connect your wallet to track accrued staking rewards and manage claims."
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Rewards</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Alert className="mb-6 bg-lightblue-50 border-lightblue-200">
        <Info className="h-4 w-4 text-lightblue-600" />
        <AlertDescription className="text-lightblue-800">
          Rewards accrual is tracked during the product phase at {summary?.apr ?? 8}% APR based on your staked
          position. On-chain reward distribution will be enabled with the upcoming Rewards contract.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="stat-card">
          <p className="text-lightblue-700">Loading rewards...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-lightblue-700">Accrued Rewards</h3>
              <Gift className="h-5 w-5 text-lightblue-500" />
            </div>
            <div className="text-2xl font-bold text-lightblue-950">
              {Number.parseFloat(summary?.accruedRewards ?? "0").toFixed(6)}
            </div>
            <div className="text-sm text-lightblue-600">ETH equivalent</div>
          </div>
          <div className="stat-card">
            <h3 className="text-sm font-medium text-lightblue-700 mb-3">Claimable Now</h3>
            <div className="text-2xl font-bold text-lightblue-950">
              {Number.parseFloat(summary?.claimableRewards ?? "0").toFixed(6)}
            </div>
            <div className="text-sm text-lightblue-600 mb-4">ETH equivalent</div>
            <Button
              onClick={handleClaim}
              disabled={claiming || Number.parseFloat(summary?.claimableRewards ?? "0") <= 0}
              className="w-full sm:w-auto"
            >
              {claiming ? "Claiming..." : "Claim Rewards"}
            </Button>
          </div>
          <div className="stat-card">
            <h3 className="text-sm font-medium text-lightblue-700 mb-1">Staked Base</h3>
            <p className="text-xl font-bold text-lightblue-950">{summary?.stakedAmount ?? "0.0000"} sETH</p>
          </div>
          <div className="stat-card">
            <h3 className="text-sm font-medium text-lightblue-700 mb-1">Total Claimed</h3>
            <p className="text-xl font-bold text-lightblue-950">
              {Number.parseFloat(summary?.claimedRewards ?? "0").toFixed(6)} ETH
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
