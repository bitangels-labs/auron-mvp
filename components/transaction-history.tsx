"use client"

import { useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { ConnectPrompt } from "@/components/connect-prompt"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  fetchTransactionHistory,
  formatTransactionType,
  type TransactionRecord,
} from "@/lib/staking-data"
import { ExternalLink, RefreshCw, History } from "lucide-react"

const typeStyles: Record<TransactionRecord["type"], string> = {
  deposit: "bg-green-100 text-green-700 border-green-200",
  withdraw: "bg-amber-100 text-amber-700 border-amber-200",
  stake: "bg-blue-100 text-blue-700 border-blue-200",
  unstake: "bg-purple-100 text-purple-700 border-purple-200",
}

export function TransactionHistory() {
  const { isConnected, account, provider } = useWeb3()
  const [records, setRecords] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadHistory = async () => {
    if (!provider || !account) return
    try {
      setLoading(true)
      const history = await fetchTransactionHistory(provider, account)
      setRecords(history)
    } catch (error) {
      console.error("Error loading transaction history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && account && provider) {
      loadHistory()
    }
  }, [isConnected, account, provider])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadHistory()
    setTimeout(() => setRefreshing(false), 800)
  }

  if (!isConnected) {
    return (
      <ConnectPrompt
        title="Transaction History"
        description="Connect your wallet to view your deposit, stake, unstake, and withdrawal activity."
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">Transaction History</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="stat-card">
        {loading ? (
          <p className="text-lightblue-700">Loading on-chain activity...</p>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-10 w-10 text-lightblue-400 mx-auto mb-3" />
            <p className="text-lightblue-700">No transactions found for your wallet on Sepolia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-lightblue-100 text-left text-lightblue-600">
                  <th className="py-3 pr-4 font-medium">Type</th>
                  <th className="py-3 pr-4 font-medium">Amount</th>
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 font-medium">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-lightblue-50 last:border-0">
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={typeStyles[record.type]}>
                        {formatTransactionType(record.type)}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 font-medium text-lightblue-950">
                      {Number.parseFloat(record.amount).toFixed(4)} {record.token}
                    </td>
                    <td className="py-3 pr-4 text-lightblue-700">
                      {record.timestamp > 0
                        ? new Date(record.timestamp * 1000).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3">
                      <a
                        href={record.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-lightblue-600 hover:text-lightblue-800"
                      >
                        {record.txHash.substring(0, 10)}...
                        <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
