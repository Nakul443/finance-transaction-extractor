'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { transactionAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useSession, signOut } from "next-auth/react" // Changed: added signOut

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

export default function DashboardPage() {
  const router = useRouter()
  // Auth.js session hook
  const { data: session, status } = useSession()

  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)

  // NEW: Pagination State
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // 1. Updated Effect: Fires only when auth is confirmed and token is present
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    } else if (status === "authenticated" && session?.accessToken) {
      // We only fetch once we have a valid token
      fetchTransactions();
    }
  }, [status, session?.accessToken, router]);
  // Added session?.accessToken to dependencies to re-run if token updates

  // Updated to support cursor-based pagination
  const fetchTransactions = async (cursor?: string) => {
    if (cursor) setIsLoadingMore(true);
    else setIsLoadingTransactions(true);

    try {
      // API call with limit and cursor
      const response = await transactionAPI.list(10, cursor);

      const newTransactions = response.data.transactions;

      if (cursor) {
        // If loading more, append to existing list
        setTransactions(prev => [...prev, ...newTransactions]);
      } else {
        // Initial load
        setTransactions(newTransactions);
      }

      setNextCursor(response.data.nextCursor);
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to load transactions. Check your backend connection.')
    } finally {
      setIsLoadingTransactions(false)
      setIsLoadingMore(false)
    }
  }

  const handleExtract = async () => {
    if (!text.trim()) return
    setIsLoading(true)
    try {
      const response = await transactionAPI.extract(text)
      // Add new transaction to the TOP of the list immediately
      setTransactions([response.data.transaction, ...transactions])
      setText('')
      toast.success('Transaction saved!')
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Extraction failed';
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Implementation for the delete function
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await transactionAPI.delete(id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success("Transaction deleted");
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  }

  const handleLogout = () => {
    // Auth.js sign out handles clearing cookies/session
    signOut({ callbackUrl: '/login' })
  }

  // 3. THIS IS THE SCREEN YOU WERE STUCK ON (Handled by status)
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-500">Securing your session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {session?.user?.name || 'User'}!
            </h1>
            <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">
              {/* Pulling org ID from Auth.js custom session token */}
              Org ID: {(session?.user as any)?.organizationId || 'Personal'}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Input */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Extract Transaction</CardTitle>
                <CardDescription>Paste raw bank SMS or email text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., Paid Rs. 500 to Starbucks at 2:00 PM..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <Button onClick={handleExtract} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Process Text'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>History</CardTitle>
                <span className="text-xs text-gray-400">{transactions.length} items loaded</span>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border bg-white">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-24 text-center">
                                No transactions found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            transactions.map((t) => (
                              <TableRow key={t.id}>
                                <TableCell className="text-xs text-gray-500">
                                  {new Date(t.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-medium">{t.description}</TableCell>
                                <TableCell>
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
                                    {t.category || 'Other'}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold">
                                  ₹{t.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-400 hover:text-red-600"
                                    onClick={() => handleDelete(t.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Load More Button */}
                    {nextCursor && (
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchTransactions(nextCursor)}
                          disabled={isLoadingMore}
                          className="text-gray-500"
                        >
                          {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Load more transactions'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}