'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { transactionAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isPageLoading, setIsPageLoading] = useState(true) // Initial "Global" loading

  useEffect(() => {
    // 1. Check if we have the keys
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    console.log("🔍 [DEBUG] Token found:", !!token)
    console.log("🔍 [DEBUG] User found:", !!storedUser)

    if (!token || !storedUser) {
      console.error("❌ [AUTH] Missing credentials! Redirecting to login...")
      // COMMENT THIS OUT TEMPORARILY TO STOP THE LOOP
      // router.push('/login') 
      setIsPageLoading(false) // Let us see the page even if it fails
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setIsPageLoading(false)
      fetchTransactions()
    } catch (e) {
      console.error("❌ [AUTH] Data corruption in LocalStorage")
      setIsPageLoading(false)
    }
  }, [])

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true)
    try {
      const response = await transactionAPI.list(10)
      setTransactions(response.data.transactions)
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to load transactions. Check your backend connection.')
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const handleExtract = async () => {
    if (!text.trim()) return
    setIsLoading(true)
    try {
      const response = await transactionAPI.extract(text)
      setTransactions([response.data.transaction, ...transactions])
      setText('')
      toast.success('Transaction saved!')
    } catch (error: any) {
      toast.error('Extraction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  // 3. THIS IS THE SCREEN YOU WERE STUCK ON
  if (isPageLoading) {
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
              Welcome, {user?.name || 'User'}!
            </h1>
            <p className="text-gray-600">Org: {user?.organizationId}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Extract Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste bank text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
            />
            <Button onClick={handleExtract} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Extract'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-center py-10 text-gray-400">No transactions found.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  <div key={t.id} className="p-4 border rounded-md flex justify-between bg-white">
                    <div>
                      <p className="font-bold">{t.description}</p>
                      <p className="text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <p className="font-mono font-bold">₹{t.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}