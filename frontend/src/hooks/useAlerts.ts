import { useState, useEffect, useCallback } from 'react'
import { coreApi } from '@/lib/axios'
import type { PriceAlert } from '@/types'

interface UseAlertsResult {
  alerts: PriceAlert[]
  loading: boolean
  error: string | null
  refetch: () => void
  createAlert: (ticker: string, targetPrice: number, condition: 'ABOVE' | 'BELOW') => Promise<void>
  updateAlert: (id: string, targetPrice: number, condition: 'ABOVE' | 'BELOW') => Promise<void>
  deleteAlert: (id: string) => Promise<void>
}

export function useAlerts(): UseAlertsResult {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await coreApi.get('/api/v1/alerts')
      setAlerts(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createAlert = useCallback(async (
    ticker: string,
    targetPrice: number,
    condition: 'ABOVE' | 'BELOW',
  ) => {
    await coreApi.post('/api/v1/alerts', { ticker, targetPrice, condition })
    await fetch()
  }, [fetch])

  const updateAlert = useCallback(async (
    id: string,
    targetPrice: number,
    condition: 'ABOVE' | 'BELOW',
  ) => {
    await coreApi.patch(`/api/v1/alerts/${id}`, { targetPrice, condition })
    await fetch()
  }, [fetch])

  const deleteAlert = useCallback(async (id: string) => {
    await coreApi.delete(`/api/v1/alerts/${id}`)
    await fetch()
  }, [fetch])

  return { alerts, loading, error, refetch: fetch, createAlert, updateAlert, deleteAlert }
}
