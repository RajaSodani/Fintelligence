import { useState, useEffect } from 'react'
import { coreApi } from '@/lib/axios'

export interface CategoryTotal {
  category: string
  total: number
}

export interface MonthlyTotal {
  month: string
  income: number
  expenses: number
}

export interface Comparison {
  thisMonth: number
  lastMonth: number
  changePercent: number
}

interface SummaryResult {
  byCategory: CategoryTotal[]
  monthly: MonthlyTotal[]
  comparison: Comparison | null
  loading: boolean
  error: string | null
}

export function useTransactionSummary(): SummaryResult {
  const [byCategory, setByCategory] = useState<CategoryTotal[]>([])
  const [monthly, setMonthly] = useState<MonthlyTotal[]>([])
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const { data } = await coreApi.get('/api/v1/transactions/summary')
        if (cancelled) return
        setByCategory(data.byCategory ?? [])
        setMonthly(data.monthly ?? [])
        setComparison(data.comparison ?? null)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load summary')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { byCategory, monthly, comparison, loading, error }
}
