import { useState, useEffect } from 'react'
import { coreApi } from '@/lib/axios'

export interface NetWorthTrendPoint {
  month: string
  value: number
}

export interface NetWorthAccount {
  id: string
  name: string
  type: string
  balance: number
}

export interface NetWorthResult {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  accounts: NetWorthAccount[]
  trend: NetWorthTrendPoint[]
  loading: boolean
  error: string | null
}

export function useNetWorth(): NetWorthResult {
  const [netWorth, setNetWorth] = useState(0)
  const [totalAssets, setTotalAssets] = useState(0)
  const [totalLiabilities, setTotalLiabilities] = useState(0)
  const [accounts, setAccounts] = useState<NetWorthAccount[]>([])
  const [trend, setTrend] = useState<NetWorthTrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const { data } = await coreApi.get('/api/v1/transactions/net-worth')
        if (cancelled) return
        setNetWorth(data.netWorth ?? 0)
        setTotalAssets(data.totalAssets ?? 0)
        setTotalLiabilities(data.totalLiabilities ?? 0)
        setAccounts(data.accounts ?? [])
        setTrend(data.trend ?? [])
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load net worth')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handler = () => {
      setLoading(true)
      coreApi.get('/api/v1/transactions/net-worth').then(({ data }) => {
        setNetWorth(data.netWorth ?? 0)
        setTotalAssets(data.totalAssets ?? 0)
        setTotalLiabilities(data.totalLiabilities ?? 0)
        setAccounts(data.accounts ?? [])
        setTrend(data.trend ?? [])
      }).catch(() => {}).finally(() => setLoading(false))
    }
    window.addEventListener('finmind:sync', handler)
    return () => window.removeEventListener('finmind:sync', handler)
  }, [])

  return { netWorth, totalAssets, totalLiabilities, accounts, trend, loading, error }
}
