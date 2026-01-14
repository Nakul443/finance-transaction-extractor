// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react' // react memory and side effects (allows to perform actions that occur outside normal rendering)
import { useRouter } from 'next/navigation' // allows page changes
import { Button } from '@/components/ui/button' // import button component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card' // import card components
import { Textarea } from '@/components/ui/textarea' // import textarea component
import { transactionAPI } from '@/lib/api' // import transactionAPI from api.ts
import { authClient } from '@/lib/auth/client' // import Better Auth client
import { toast } from 'sonner' // for showing success/error messages
import { Loader2 } from 'lucide-react' // loading spinner icon

// transaction type definition according to the backend
interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category?: string
  confidence: number
  balanceAfter?: number
  createdAt: string
}

// main function for dashboard page
export default function DashboardPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [pagination, setPagination] = useState({
    hasMore: false,
    nextCursor: null as string | null,
    total: 0
  })
  const [session, setSession] = useState<any>(null) // Better Auth session state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true) // Auth checking state

  // Check authentication with Better Auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get session from Better Auth
        const authSession = await authClient.getSession()
        
        if (authSession?.data?.user) {
          setSession(authSession.data)
        } else {
          // No session, redirect to login
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login')
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  // Load initial transactions when session is available
  useEffect(() => {
    if (session) {
      loadTransactions()
    }
  }, [session])

  const loadTransactions = async () => {
    setIsLoadingTransactions(true)
    try {
      const response = await transactionAPI.list(10)
      setTransactions(response.data.transactions)
      setPagination(response.data.pagination)
    } catch (error) {
      toast.error('Failed to load transactions')
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const handleExtract = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to parse')
      return
    }

    setIsLoading(true)
    try {
      const response = await transactionAPI.extract(text)
      
      // Add new transaction to the list
      setTransactions([response.data.transaction, ...transactions])
      
      toast.success('Transaction extracted!', {
        description: `Confidence: ${(response.data.extractionDetails.confidence * 100).toFixed(0)}%`
      })
      
      // Clear textarea
      setText('')
      
      // Refresh transaction count
      loadTransactions()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Extraction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = async () => {
    if (!pagination.nextCursor) return
    
    try {
      const response = await transactionAPI.list(10, pagination.nextCursor)
      setTransactions([...transactions, ...response.data.transactions])
      setPagination(response.data.pagination)
    } catch (error) {
      toast.error('Failed to load more transactions')
    }
  }

  // Handle logout with Better Auth
  const handleLogout = async () => {
    try {
      await authClient.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // If no session, don't render (redirect will happen)
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {session.user?.name || session.user?.email}!
            </h1>
            <p className="text-gray-600 mt-2">
              Organization ID: {session.user?.organizationId}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="ml-4"
          >
            Logout
          </Button>
        </header>

        {/* Extraction Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Extract Transaction</CardTitle>
            <CardDescription>
              Paste your bank statement text below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder={`Try these sample texts:\n\n1. Date: 11 Dec 2025\nDescription: STARBUCKSCOFFEEMUMBAI\nAmount: 420.00\nBalance after transaction: 18,420.50\n\n2. Uber Ride * Airport Drop\n12/11/2025 → x1,250.00 debited\nAvailable Balance → x17,170.50\n\n3. txrt123 2025-12-10 Amazon in Order #403-1284567 8901284 x2,999.00 Dr Bal 14171.50 Shopping`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="resize-none font-mono"
              />
              <Button 
                onClick={handleExtract} 
                disabled={isLoading || !text.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  'Extract & Save Transaction'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Transactions</CardTitle>
            <CardDescription>
              {pagination.total} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions yet. Paste a bank statement above to get started!
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{transaction.description}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()} • {transaction.category || 'Uncategorized'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₹{Math.abs(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-gray-500">
                            Confidence: {(transaction.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      {transaction.balanceAfter && (
                        <p className="text-sm text-gray-600 mt-2">
                          Balance after: ₹{transaction.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {pagination.hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      disabled={!pagination.nextCursor}
                    >
                      Load More Transactions
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}