import { Suspense } from "react"
import { DepositWithdraw } from "@/components/deposit-withdraw"

export default function DepositPage() {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <Suspense fallback={<div className="text-lightblue-700">Loading...</div>}>
        <DepositWithdraw />
      </Suspense>
    </div>
  )
}
