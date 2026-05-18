import { useState, useEffect, useCallback } from 'react'
import { coreApi } from '@/lib/axios'
import type { WatchlistItem } from '@/types'

interface UseWatchlistResult {
  items: WatchlistItem[]
  loading: boolean
  error: string | null
  refetch: () => void
  addTicker: (ticker: string) => Promise<void>
  removeTicker: (id: string) => Promise<void>
}

export function useWatchlist(): UseWatchlistResult {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await coreApi.get('/api/v1/watchlist')
      setItems(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load watchlist')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addTicker = useCallback(async (ticker: string) => {
    await coreApi.post('/api/v1/watchlist', { ticker })
    await fetch()
  }, [fetch])

  const removeTicker = useCallback(async (id: string) => {
    await coreApi.delete(`/api/v1/watchlist/${id}`)
    await fetch()
  }, [fetch])

  return { items, loading, error, refetch: fetch, addTicker, removeTicker }
}
