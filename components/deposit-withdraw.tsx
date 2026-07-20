"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useWeb3 } from "@/components/web3-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, MinusCircle, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DepositWithdraw() {
  const { dETHContract, isConnected, ethBalance, dETHBalance, refreshBalances } = useWeb3()
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [activeTab, setActiveTab] = useState("deposit")
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "withdraw") setActiveTab("withdraw")
    if (tab === "deposit") setActiveTab("deposit")
  }, [searchParams])

  // Refresh balances when component mounts
  useEffect(() => {
    if (isConnected) {
      refreshBalances()
    }
  }, [isConnected])

  const setMaxDeposit = () => {
    // Leave a small amount for gas
    if (Number.parseFloat(ethBalance) > 0.01) {
      const maxAmount = (Number.parseFloat(ethBalance) - 0.01).toFixed(18)
      setDepositAmount(maxAmount)
    } else {
      setDepositAmount("0")
    }
  }

  const handleDeposit = async () => {
    if (!dETHContract || !depositAmount) return

    try {
      setIsDepositing(true)
      const amount = ethers.parseEther(depositAmount)

      // Check if user has enough ETH
      if (Number.parseFloat(ethBalance) < Number.parseFloat(depositAmount)) {
        toast({
          title: "Insufficient ETH Balance",
          description: "You don't have enough ETH to complete this deposit.",
          variant: "destructive",
        })
        return
      }

      const tx = await dETHContract.deposit({ value: amount })
      toast({
        title: "Transaction Submitted",
        description: "Your deposit transaction has been submitted.",
      })

      await tx.wait()

      toast({
        title: "Deposit Successful",
        description: `Successfully deposited ${depositAmount} ETH and received dETH.`,
      })

      setDepositAmount("")
      refreshBalances()
    } catch (error) {
      console.error("Error depositing ETH:", error)
      toast({
        title: "Deposit Failed",
        description: "There was an error processing your deposit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDepositing(false)
    }
  }

  const setMaxWithdraw = () => {
    setWithdrawAmount(dETHBalance)
  }

  const handleWithdraw = async () => {
    if (!dETHContract || !withdrawAmount) return

    try {
      setIsWithdrawing(true)
      const amount = ethers.parseEther(withdrawAmount)

      // Check if user has enough dETH
      if (Number.parseFloat(dETHBalance) < Number.parseFloat(withdrawAmount)) {
        toast({
          title: "Insufficient dETH Balance",
          description: "You don't have enough dETH to complete this withdrawal.",
          variant: "destructive",
        })
        return
      }

      const tx = await dETHContract.withdraw(amount)
      toast({
        title: "Transaction Submitted",
        description: "Your withdrawal transaction has been submitted.",
      })

      await tx.wait()

      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrawn ${withdrawAmount} dETH and received ETH.`,
      })

      setWithdrawAmount("")
      refreshBalances()
    } catch (error) {
      console.error("Error withdrawing ETH:", error)
      toast({
        title: "Withdrawal Failed",
        description: "There was an error processing your withdrawal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-lightblue-600 mb-4">Please connect your wallet to access deposit and withdraw features.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Deposit & Withdraw</h1>

      <Tabs defaultValue="deposit" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="animate-slide-in">
          <div className="action-card">
            <h2 className="text-xl font-semibold mb-2 flex items-center text-lightblue-900">
              <PlusCircle className="h-5 w-5 mr-2 text-lightblue-500" />
              Deposit
            </h2>
            <p className="text-lightblue-700 mb-6">Add ETH to your account balance.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-lightblue-900">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input-amount pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm font-medium text-lightblue-700">ETH</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-lightblue-700">Available: {Number.parseFloat(ethBalance).toFixed(4)} ETH</span>
                  <button onClick={setMaxDeposit} className="text-lightblue-500 hover:underline">
                    Max
                  </button>
                </div>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={!depositAmount || isDepositing || Number.parseFloat(depositAmount) <= 0}
                className="primary-button"
              >
                {isDepositing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Deposit ETH
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="withdraw" className="animate-slide-in">
          <div className="action-card">
            <h2 className="text-xl font-semibold mb-2 flex items-center text-lightblue-900">
              <MinusCircle className="h-5 w-5 mr-2 text-lightblue-500" />
              Withdraw
            </h2>
            <p className="text-lightblue-700 mb-6">Withdraw your ETH by burning dETH tokens.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-lightblue-900">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="input-amount pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-sm font-medium text-lightblue-700">dETH</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-lightblue-700">
                    Available: {Number.parseFloat(dETHBalance).toFixed(4)} dETH
                  </span>
                  <button onClick={setMaxWithdraw} className="text-lightblue-500 hover:underline">
                    Max
                  </button>
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || isWithdrawing || Number.parseFloat(withdrawAmount) <= 0}
                className="primary-button"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <MinusCircle className="mr-2 h-4 w-4" />
                    Withdraw ETH
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
