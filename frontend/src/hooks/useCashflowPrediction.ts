import { useState, useCallback } from 'react'
import { aiApi } from '@/lib/axios'

export interface PredictedMonth {
  month: string
  income: number
  expenses: number
  net: number
}

interface MonthlyInput {
  month: string
  income: number
  expenses: number
}

interface PredictionResult {
  prediction: PredictedMonth[]
  confidence: number
  trend: 'improving' | 'declining' | 'stable'
  loading: boolean
  error: string | null
  predict: (data: MonthlyInput[]) => void
}

export function useCashflowPrediction(): PredictionResult {
  const [prediction, setPrediction] = useState<PredictedMonth[]>([])
  const [confidence, setConfidence] = useState(0)
  const [trend, setTrend] = useState<'improving' | 'declining' | 'stable'>('stable')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const predict = useCallback(async (data: MonthlyInput[]) => {
    setLoading(true)
    setError(null)
    try {
      const { data: result } = await aiApi.post('/api/cashflow/predict', { monthly_data: data })
      setPrediction(result.prediction)
      setConfidence(result.confidence)
      setTrend(result.trend)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }, [])

  return { prediction, confidence, trend, loading, error, predict }
}
