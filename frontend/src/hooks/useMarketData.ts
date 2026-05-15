import { useState, useEffect, useCallback } from 'react'
import { coreApi } from '@/lib/axios'
import type { MarketQuote, OHLCPoint } from '@/types'

interface UseMarketStripResult {
  quotes: MarketQuote[]
  loading: boolean
}

export function useMarketStrip(refreshInterval = 30_000): UseMarketStripResult {
  const [quotes, setQuotes] = useState<MarketQuote[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const { data } = await coreApi.get('/api/v1/market/strip')
      setQuotes(data)
    } catch {
      // keep stale data on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    const id = setInterval(fetch, refreshInterval)
    return () => clearInterval(id)
  }, [fetch, refreshInterval])

  return { quotes, loading }
}

interface UseOHLCResult {
  data: OHLCPoint[]
  loading: boolean
  error: string | null
}

export function useOHLC(ticker: string | null, range: string): UseOHLCResult {
  const [data, setData] = useState<OHLCPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ticker) return
    let cancelled = false
    setLoading(true)
    setError(null)
    coreApi
      .get(`/api/v1/market/${encodeURIComponent(ticker)}/ohlc?range=${range}`)
      .then(({ data: res }) => { if (!cancelled) setData(res) })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load chart data')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ticker, range])

  return { data, loading, error }
}
