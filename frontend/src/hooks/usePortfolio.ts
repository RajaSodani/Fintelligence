import { useState, useEffect, useCallback } from 'react'
import { coreApi } from '@/lib/axios'
import type { PortfolioSummary } from '@/types'

interface UsePortfolioResult extends PortfolioSummary {
  loading: boolean
  error: string | null
  refetch: () => void
  addHolding: (ticker: string, quantity: number, avgBuyPrice: number) => Promise<void>
  deleteHolding: (id: string) => Promise<void>
}

export function usePortfolio(): UsePortfolioResult {
  const [data, setData] = useState<PortfolioSummary>({
    holdings: [],
    totalValue: 0,
    totalPnl: 0,
    totalPnlPercent: 0,
    dayPnl: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: res } = await coreApi.get('/api/v1/portfolio')
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addHolding = useCallback(async (ticker: string, quantity: number, avgBuyPrice: number) => {
    await coreApi.post('/api/v1/portfolio', { ticker, quantity, avgBuyPrice })
    await fetch()
  }, [fetch])

  const deleteHolding = useCallback(async (id: string) => {
    await coreApi.delete(`/api/v1/portfolio/${id}`)
    await fetch()
  }, [fetch])

  return { ...data, loading, error, refetch: fetch, addHolding, deleteHolding }
}
