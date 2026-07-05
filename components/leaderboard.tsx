"use client"

import { useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ethers } from "ethers"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Trophy, Medal, Award, RefreshCw, Loader2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function Leaderboard() {
  const { stakingDashboardContract, sETHContract, isConnected, account } = useWeb3()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<{
    addresses: string[]
    amounts: string[]
    percentages: string[]
  }>({
    addresses: [],
    amounts: [],
    percentages: [],
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [stats, setStats] = useState({
    totalStaked: "0",
    totalStakers: "0",
  })
  const { toast } = useToast()

  const fetchLeaderboard = async () => {
    if (stakingDashboardContract) {
      try {
        setLoading(true)

        // Get staking overview
        const overview = await stakingDashboardContract.getStakingOverview()
        setStats({
          totalStaked: ethers.formatEther(overview.totalETHStaked),
          totalStakers: overview.totalStakers.toString(),
        })

        // Get top 10 stakers
        const leaderboardData = await stakingDashboardContract.getLeaderboard(10)

        const addresses = leaderboardData.stakerAddresses
        const amounts = leaderboardData.stakedAmounts.map((amount: bigint) => ethers.formatEther(amount))
        const percentages = leaderboardData.percentageOfTotal.map((percentage: bigint) =>
          (Number(percentage) / 100).toFixed(2),
        )

        setLeaderboard({
          addresses,
          amounts,
          percentages,
        })
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [stakingDashboardContract])

  const updateLeaderboard = async () => {
    if (!sETHContract || !isConnected) return

    try {
      setIsUpdating(true)

      const tx = await sETHContract.updateLeaderboard()
      toast({
        title: "Transaction Submitted",
        description: "Leaderboard update transaction has been submitted.",
      })

      await tx.wait()

      toast({
        title: "Leaderboard Updated",
        description: "The staking leaderboard has been successfully updated.",
      })

      // Refresh leaderboard data
      fetchLeaderboard()
    } catch (error) {
      console.error("Error updating leaderboard:", error)
      toast({
        title: "Update Failed",
        description: "There was an error updating the leaderboard. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getTrophyIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
    if (index === 2) return <Award className="h-5 w-5 text-amber-700" />
    return null
  }

  const formatAddress = (address: string) => {
    if (address === account) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)} (You)`
    }
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">Staking Leaderboard</h2>
        <Button variant="outline" size="sm" onClick={updateLeaderboard} disabled={isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Ranks
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
              Total ETH Staked
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="text-2xl font-bold text-lightblue-900">
                {Number.parseFloat(stats.totalStaked).toFixed(4)} ETH
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-4 w-4 text-lightblue-500" />
              Total Stakers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="text-2xl font-bold text-lightblue-900">{stats.totalStakers}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Stakers</CardTitle>
          <CardDescription>The top stakers by amount of ETH staked</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : leaderboard.addresses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Amount Staked</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.addresses.map((address, index) => (
                  <TableRow
                    key={index}
                    className={
                      address === account ? "bg-lightblue-100 hover:bg-lightblue-200" : "hover:bg-lightblue-50"
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {getTrophyIcon(index) || (
                          <Badge
                            variant="outline"
                            className="h-6 w-6 p-0 flex items-center justify-center border-lightblue-300"
                          >
                            {index + 1}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {address === account ? (
                        <span className="font-medium text-lightblue-700">{formatAddress(address)}</span>
                      ) : (
                        <span className="text-lightblue-800">{formatAddress(address)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-lightblue-800">
                      {Number.parseFloat(leaderboard.amounts[index]).toFixed(4)} ETH
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={index === 0 ? "default" : "outline"}
                        className={
                          index === 0
                            ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                            : "bg-lightblue-50 text-lightblue-700 border-lightblue-300"
                        }
                      >
                        {leaderboard.percentages[index]}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-lightblue-600">
              <Trophy className="mx-auto h-12 w-12 mb-4 text-lightblue-300" />
              <p className="text-lg font-medium mb-2 text-lightblue-800">No stakers found</p>
              <p className="max-w-md mx-auto text-lightblue-600">
                Be the first to stake and appear on the leaderboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
