import { useState, useEffect, useCallback } from 'react'
import { coreApi } from '@/lib/axios'

export interface Transaction {
  id: string
  name: string
  amount: number
  category: string | null
  subCategory: string | null
  date: string
  merchantName: string | null
  pending: boolean
}

interface UseTransactionsOptions {
  limit?: number
  offset?: number
  category?: string
  startDate?: string
  endDate?: string
}

interface TransactionsResult {
  transactions: Transaction[]
  total: number
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useTransactions(options: UseTransactionsOptions = {}): TransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (options.limit) params.set('limit', String(options.limit))
      if (options.offset) params.set('offset', String(options.offset))
      if (options.category) params.set('category', options.category)
      if (options.startDate) params.set('startDate', options.startDate)
      if (options.endDate) params.set('endDate', options.endDate)

      const { data } = await coreApi.get(`/api/v1/transactions?${params}`)
      setTransactions(data.transactions)
      setTotal(data.total)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [options.limit, options.offset, options.category, options.startDate, options.endDate])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    window.addEventListener('finmind:sync', fetch as EventListener)
    return () => window.removeEventListener('finmind:sync', fetch as EventListener)
  }, [fetch])

  return { transactions, total, loading, error, refetch: fetch }
}
