import { useState, useEffect, useCallback } from 'react'
import { coreApi } from '@/lib/axios'

export interface Account {
  id: string
  name: string
  type: string
  subType: string | null
  balance: number
  currency: string
  fipId: string | null
  maskedAccNumber: string | null
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await coreApi.get('/api/v1/setu/accounts')
      setAccounts(data ?? [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { accounts, loading, error, refetch: fetch }
}
