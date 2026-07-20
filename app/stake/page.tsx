import { Suspense } from "react"
import { StakeUnstake } from "@/components/stake-unstake"

export default function StakePage() {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <Suspense fallback={<div className="text-lightblue-700">Loading...</div>}>
        <StakeUnstake />
      </Suspense>
    </div>
  )
}
