import { ethers } from "ethers"
import dETHAbi from "@/lib/abis/dETH.json"
import sETHAbi from "@/lib/abis/sETH.json"
import {
  DETH_ADDRESS,
  HISTORY_BLOCK_RANGE,
  SEPOLIA_EXPLORER,
  SETH_ADDRESS,
  STAKING_REWARD_APR,
} from "@/lib/contracts"

export type TransactionType = "deposit" | "withdraw" | "stake" | "unstake"

export type TransactionRecord = {
  id: string
  type: TransactionType
  amount: string
  token: string
  timestamp: number
  txHash: string
  explorerUrl: string
}

export type StakingPosition = {
  stakedAmount: string
  stakingTimestamp: number
  rank: string
  percentageOfTotal: string
  daysStaked: number
}

export type RewardSummary = {
  stakedAmount: string
  accruedRewards: string
  claimedRewards: string
  claimableRewards: string
  apr: number
  stakingSince: number | null
}

const CLAIMED_REWARDS_KEY = "auron-claimed-rewards"

export function getClaimedRewards(account: string): number {
  if (typeof window === "undefined") return 0
  const raw = localStorage.getItem(`${CLAIMED_REWARDS_KEY}-${account.toLowerCase()}`)
  return raw ? Number.parseFloat(raw) : 0
}

export function setClaimedRewards(account: string, amount: number) {
  if (typeof window === "undefined") return
  localStorage.setItem(`${CLAIMED_REWARDS_KEY}-${account.toLowerCase()}`, amount.toString())
}

export function calculateAccruedRewards(stakedAmount: number, stakingTimestamp: number): number {
  if (stakedAmount <= 0 || stakingTimestamp <= 0) return 0
  const secondsStaked = Math.max(0, Math.floor(Date.now() / 1000) - stakingTimestamp)
  const annualReward = stakedAmount * STAKING_REWARD_APR
  return (annualReward * secondsStaked) / (365 * 24 * 60 * 60)
}

export async function fetchStakingPosition(
  stakingDashboardContract: ethers.Contract,
  account: string,
): Promise<StakingPosition | null> {
  const details = await stakingDashboardContract.getStakerDetails(account)
  const stakedAmount = ethers.formatEther(details.stakedAmount)
  const stakingTimestamp = Number(details.stakingTimestamp)
  const daysStaked =
    stakingTimestamp > 0 ? Math.floor((Date.now() / 1000 - stakingTimestamp) / (24 * 60 * 60)) : 0

  return {
    stakedAmount,
    stakingTimestamp,
    rank: details.rank.toString(),
    percentageOfTotal: (Number(details.percentageOfTotal) / 100).toFixed(2),
    daysStaked,
  }
}

export function buildRewardSummary(
  position: StakingPosition | null,
  account: string,
): RewardSummary {
  const stakedAmount = position ? Number.parseFloat(position.stakedAmount) : 0
  const accrued = position ? calculateAccruedRewards(stakedAmount, position.stakingTimestamp) : 0
  const claimed = getClaimedRewards(account)
  const claimable = Math.max(0, accrued - claimed)

  return {
    stakedAmount: stakedAmount.toFixed(4),
    accruedRewards: accrued.toFixed(6),
    claimedRewards: claimed.toFixed(6),
    claimableRewards: claimable.toFixed(6),
    apr: STAKING_REWARD_APR * 100,
    stakingSince: position?.stakingTimestamp ?? null,
  }
}

export async function fetchTransactionHistory(
  provider: ethers.JsonRpcProvider,
  account: string,
): Promise<TransactionRecord[]> {
  const currentBlock = await provider.getBlockNumber()
  const fromBlock = Math.max(0, currentBlock - HISTORY_BLOCK_RANGE)

  const dETH = new ethers.Contract(DETH_ADDRESS, dETHAbi, provider)
  const sETH = new ethers.Contract(SETH_ADDRESS, sETHAbi, provider)

  const [deposits, withdraws, stakes, unstakes] = await Promise.all([
    dETH.queryFilter(dETH.filters.ETHDeposited(account), fromBlock),
    dETH.queryFilter(dETH.filters.ETHWithdrawn(account), fromBlock),
    sETH.queryFilter(sETH.filters.Staked(account), fromBlock),
    sETH.queryFilter(sETH.filters.Unstaked(account), fromBlock),
  ])

  const records: TransactionRecord[] = []

  const appendRecords = async (
    logs: (ethers.EventLog | ethers.Log)[],
    type: TransactionType,
    token: string,
    amountIndex: number,
  ) => {
    for (const log of logs) {
      if (!("args" in log) || !log.args) continue
      const block = await log.getBlock()
      const amount = ethers.formatEther(log.args[amountIndex])

      records.push({
        id: `${log.transactionHash}-${log.index}`,
        type,
        amount,
        token,
        timestamp: block?.timestamp ?? 0,
        txHash: log.transactionHash,
        explorerUrl: `${SEPOLIA_EXPLORER}/tx/${log.transactionHash}`,
      })
    }
  }

  await appendRecords(deposits, "deposit", "ETH", 1)
  await appendRecords(withdraws, "withdraw", "dETH", 1)
  await appendRecords(stakes, "stake", "dETH", 1)
  await appendRecords(unstakes, "unstake", "sETH", 1)

  return records.sort((a, b) => b.timestamp - a.timestamp)
}

export function formatTransactionType(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    deposit: "Deposit",
    withdraw: "Withdraw",
    stake: "Stake",
    unstake: "Unstake",
  }
  return labels[type]
}
