"use client"

import { useEffect, useState } from "react"
import { useWeb3 } from "@/components/web3-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, XCircle, Clock, Loader2, FileText, Vote, RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Proposal = {
  id: number
  proposer: string
  description: string
  createdAt: number
  votesFor: string
  votesAgainst: string
  executed: boolean
  canceled: boolean
  state: number
}

export function Governance() {
  const { governanceContract, sETHContract, isConnected, account, sETHBalance } = useWeb3()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState("")
  const [target, setTarget] = useState("")
  const [callData, setCallData] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isVoting, setIsVoting] = useState<Record<string, boolean>>({} as Record<string, boolean>)
  const [isExecuting, setIsExecuting] = useState<Record<string, boolean>>({} as Record<string, boolean>)
  const [isCanceling, setIsCanceling] = useState<Record<string, boolean>>({} as Record<string, boolean>)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchProposals = async () => {
    if (governanceContract) {
      try {
        setLoading(true)

        // Get proposal count
        const count = await governanceContract.proposalCount()
        const proposalCount = Number(count)

        // Fetch all proposals
        const proposalPromises = []
        for (let i = 0; i < proposalCount; i++) {
          proposalPromises.push(governanceContract.getProposalDetails(i))
        }

        const proposalData = await Promise.all(proposalPromises)

        // Format proposals
        const formattedProposals = proposalData.map((proposal, index) => ({
          id: index,
          proposer: proposal.proposer,
          description: proposal.description,
          createdAt: Number(proposal.createdAt),
          votesFor: ethers.formatEther(proposal.votesFor),
          votesAgainst: ethers.formatEther(proposal.votesAgainst),
          executed: proposal.executed,
          canceled: proposal.canceled,
          state: proposal.state,
        }))

        setProposals(formattedProposals)
      } catch (error) {
        console.error("Error fetching proposals:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [governanceContract])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchProposals()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const createProposal = async () => {
    if (!governanceContract || !description || !target) return

    try {
      setIsCreating(true)

      // Check if user has enough sETH
      if (Number.parseFloat(sETHBalance) < 1) {
        toast({
          title: "Insufficient sETH Balance",
          description: "You need at least 1 sETH to create a proposal.",
          variant: "destructive",
        })
        return
      }

      // Format call data
      const formattedCallData = callData ? ethers.hexlify(ethers.toUtf8Bytes(callData)) : "0x"

      const tx = await governanceContract.createProposal(description, target, formattedCallData)
      toast({
        title: "Transaction Submitted",
        description: "Your proposal creation transaction has been submitted.",
      })

      await tx.wait()

      toast({
        title: "Proposal Created",
        description: "Your governance proposal has been successfully created.",
      })

      // Reset form
      setDescription("")
      setTarget("")
      setCallData("")

      // Refresh proposals
      fetchProposals()
    } catch (error) {
      console.error("Error creating proposal:", error)
      toast({
        title: "Proposal Creation Failed",
        description: "There was an error creating your proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const voteOnProposal = async (proposalId: number, support: boolean) => {
    if (!governanceContract) return

    try {
      setIsVoting({ ...isVoting, [proposalId]: true })

      // Check if user has sETH for voting
      if (Number.parseFloat(sETHBalance) <= 0) {
        toast({
          title: "No Voting Power",
          description: "You need sETH tokens to vote on proposals.",
          variant: "destructive",
        })
        return
      }

      const tx = await governanceContract.castVote(proposalId, support)
      toast({
        title: "Vote Submitted",
        description: "Your vote has been submitted.",
      })

      await tx.wait()

      toast({
        title: "Vote Recorded",
        description: `You have successfully voted ${support ? "for" : "against"} the proposal.`,
      })

      // Refresh proposal data
      const proposalData = await governanceContract.getProposalDetails(proposalId)

      const updatedProposal = {
        id: proposalId,
        proposer: proposalData.proposer,
        description: proposalData.description,
        createdAt: Number(proposalData.createdAt),
        votesFor: ethers.formatEther(proposalData.votesFor),
        votesAgainst: ethers.formatEther(proposalData.votesAgainst),
        executed: proposalData.executed,
        canceled: proposalData.canceled,
        state: proposalData.state,
      }

      setProposals(proposals.map((p) => (p.id === proposalId ? updatedProposal : p)))
    } catch (error) {
      console.error("Error voting on proposal:", error)
      toast({
        title: "Vote Failed",
        description: "There was an error casting your vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting({ ...isVoting, [proposalId]: false })
    }
  }

  const executeProposal = async (proposalId: number) => {
    if (!governanceContract) return

    try {
      setIsExecuting({ ...isExecuting, [proposalId]: true })

      const tx = await governanceContract.executeProposal(proposalId)
      toast({
        title: "Execution Submitted",
        description: "Proposal execution transaction has been submitted.",
      })

      await tx.wait()

      toast({
        title: "Proposal Executed",
        description: "The proposal has been successfully executed.",
      })

      // Refresh proposal data
      const proposalData = await governanceContract.getProposalDetails(proposalId)

      const updatedProposal = {
        id: proposalId,
        proposer: proposalData.proposer,
        description: proposalData.description,
        createdAt: Number(proposalData.createdAt),
        votesFor: ethers.formatEther(proposalData.votesFor),
        votesAgainst: ethers.formatEther(proposalData.votesAgainst),
        executed: proposalData.executed,
        canceled: proposalData.canceled,
        state: proposalData.state,
      }

      setProposals(proposals.map((p) => (p.id === proposalId ? updatedProposal : p)))
    } catch (error) {
      console.error("Error executing proposal:", error)
      toast({
        title: "Execution Failed",
        description: "There was an error executing the proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExecuting({ ...isExecuting, [proposalId]: false })
    }
  }

  const cancelProposal = async (proposalId: number) => {
    if (!governanceContract) return

    try {
      setIsCanceling({ ...isCanceling, [proposalId]: true })

      const cancelTx = await governanceContract.cancelProposal(proposalId)
      toast({
        title: "Cancellation Submitted",
        description: "Proposal cancellation transaction has been submitted.",
      })

      await cancelTx.wait()

      toast({
        title: "Proposal Canceled",
        description: "The proposal has been successfully canceled.",
      })

      // Refresh proposal data
      const proposalData = await governanceContract.getProposalDetails(proposalId)

      const updatedProposal = {
        id: proposalId,
        proposer: proposalData.proposer,
        description: proposalData.description,
        createdAt: Number(proposalData.createdAt),
        votesFor: ethers.formatEther(proposalData.votesFor),
        votesAgainst: ethers.formatEther(proposalData.votesAgainst),
        executed: proposalData.executed,
        canceled: proposalData.canceled,
        state: proposalData.state,
      }

      setProposals(proposals.map((p) => (p.id === proposalId ? updatedProposal : p)))
    } catch (error) {
      console.error("Error canceling proposal:", error)
      toast({
        title: "Cancellation Failed",
        description: "There was an error canceling the proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCanceling({ ...isCanceling, [proposalId]: false })
    }
  }

  const getProposalStateBadge = (state: number) => {
    switch (state) {
      case 0: // Active
        return (
          <Badge variant="default" className="bg-lightblue-100 text-lightblue-700 border-lightblue-300">
            Active
          </Badge>
        )
      case 1: // Defeated
        return <Badge variant="destructive">Defeated</Badge>
      case 2: // Succeeded
        return <Badge variant="success">Succeeded</Badge>
      case 3: // Executed
        return <Badge className="bg-purple-100 text-purple-700 border-purple-300">Executed</Badge>
      case 4: // Expired
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300">Expired</Badge>
      case 5: // Canceled
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Canceled</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (!isConnected) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="page-title">Governance</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals">
          {loading ? (
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
            </div>
          ) : proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <Card key={proposal.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <FileText className="mr-2 h-5 w-5 text-lightblue-500" />
                          Proposal #{proposal.id}
                        </CardTitle>
                        <CardDescription>
                          Created by {proposal.proposer.substring(0, 6)}...{proposal.proposer.substring(38)} on{" "}
                          {new Date(proposal.createdAt * 1000).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getProposalStateBadge(proposal.state)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-6 text-lightblue-800">{proposal.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <div className="text-sm text-green-600 mb-1">Votes For</div>
                        <div className="text-xl font-semibold text-green-700">
                          {Number.parseFloat(proposal.votesFor).toFixed(2)} sETH
                        </div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <div className="text-sm text-red-600 mb-1">Votes Against</div>
                        <div className="text-xl font-semibold text-red-700">
                          {Number.parseFloat(proposal.votesAgainst).toFixed(2)} sETH
                        </div>
                      </div>
                    </div>

                    {proposal.state === 0 && (
                      // Active
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => voteOnProposal(proposal.id, true)}
                          disabled={isVoting[proposal.id]}
                        >
                          {isVoting[proposal.id] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Vote For
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => voteOnProposal(proposal.id, false)}
                          disabled={isVoting[proposal.id]}
                        >
                          {isVoting[proposal.id] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Vote Against
                        </Button>
                      </div>
                    )}

                    {proposal.state === 2 && ( // Succeeded
                      <Button
                        onClick={() => executeProposal(proposal.id)}
                        disabled={isExecuting[proposal.id]}
                        className="w-full"
                      >
                        {isExecuting[proposal.id] ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Execute Proposal
                          </>
                        )}
                      </Button>
                    )}

                    {proposal.state === 0 &&
                      proposal.proposer === account && ( // Active and user is proposer
                        <Button
                          variant="outline"
                          onClick={() => cancelProposal(proposal.id)}
                          disabled={isCanceling[proposal.id]}
                          className="w-full mt-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                        >
                          {isCanceling[proposal.id] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Canceling...
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Proposal
                            </>
                          )}
                          Cancel Proposal
                        </Button>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center border-dashed border-lightblue-200">
              <Clock className="mx-auto h-12 w-12 mb-4 text-lightblue-300" />
              <h3 className="text-lg font-medium mb-2 text-lightblue-800">No proposals yet</h3>
              <p className="text-lightblue-600 max-w-md mx-auto mb-6">
                Be the first to create a governance proposal and help shape the future of the protocol.
              </p>
              <Button variant="outline" onClick={() => document.querySelector('[data-value="create"]')?.click()}>
                Create a Proposal
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Proposal</CardTitle>
              <CardDescription>
                Create a new governance proposal. You need at least 1 sETH to create a proposal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-lightblue-800">Description</label>
                  <Textarea
                    placeholder="Describe your proposal..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none border-lightblue-200 focus:border-lightblue-400 focus:ring-lightblue-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-lightblue-800">Target Address</label>
                  <Input
                    placeholder="0x..."
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="border-lightblue-200 focus:border-lightblue-400 focus:ring-lightblue-400"
                  />
                  <p className="text-xs text-lightblue-600">
                    The contract address that will be called if the proposal passes.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-lightblue-800">Call Data (Optional)</label>
                  <Input
                    placeholder="Function call data..."
                    value={callData}
                    onChange={(e) => setCallData(e.target.value)}
                    className="border-lightblue-200 focus:border-lightblue-400 focus:ring-lightblue-400"
                  />
                  <p className="text-xs text-lightblue-600">
                    The function call data to be executed if the proposal passes.
                  </p>
                </div>

                {Number.parseFloat(sETHBalance) < 1 && (
                  <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need at least 1 sETH to create a proposal. Stake your dETH to receive sETH.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={createProposal}
                disabled={!description || !target || isCreating || Number.parseFloat(sETHBalance) < 1}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    <Vote className="mr-2 h-4 w-4" />
                    Create Proposal
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Governance
