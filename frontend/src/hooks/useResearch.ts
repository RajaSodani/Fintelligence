import { useState, useCallback, useRef } from 'react'
import type { AgentState } from '@/types'

export interface NewsHeadline {
  title: string
  source: string
  sentiment: 'green' | 'amber' | 'red' | 'blue'
  time: string
  url?: string
}

export interface FinancialMetric {
  label: string
  value: string
}

export interface SentimentScore {
  label: string
  score: number
}

export interface RiskItem {
  text: string
  severity: 'amber' | 'red'
}

export interface NewsData {
  headlines: NewsHeadline[]
  summary: string
  result_label: string
}

export interface FinancialsData {
  company_name: string
  sector: string
  exchange: string
  snapshot: FinancialMetric[]
  result_label: string
}

export interface SentimentData {
  scores: SentimentScore[]
  overall: 'bullish' | 'bearish' | 'neutral'
  summary: string
  result_label: string
}

export interface ThesisData {
  rating: string
  target_price: string
  summary: string
  risks: RiskItem[]
  verdict: string
  result_label: string
}

export interface ResearchReport {
  ticker: string
  news_data: NewsData | null
  financials_data: FinancialsData | null
  sentiment_data: SentimentData | null
  thesis_data: ThesisData | null
}

type AgentId = 'news' | 'financials' | 'sentiment' | 'thesis'

const INITIAL_STATES: Record<AgentId, AgentState> = {
  news: 'pending',
  financials: 'pending',
  sentiment: 'pending',
  thesis: 'pending',
}

interface UseResearchResult {
  agentStates: Record<AgentId, AgentState>
  agentData: Partial<Record<AgentId, unknown>>
  report: ResearchReport | null
  isRunning: boolean
  error: string | null
  runResearch: (ticker: string) => Promise<void>
  reset: () => void
}

export function useResearch(): UseResearchResult {
  const [agentStates, setAgentStates] = useState<Record<AgentId, AgentState>>(INITIAL_STATES)
  const [agentData, setAgentData] = useState<Partial<Record<AgentId, unknown>>>({})
  const [report, setReport] = useState<ResearchReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const runResearch = useCallback(async (ticker: string) => {
    if (isRunning) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsRunning(true)
    setError(null)
    setReport(null)
    setAgentStates({ ...INITIAL_STATES })
    setAgentData({})

    try {
      const token = await window.Clerk?.session?.getToken()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const baseURL = import.meta.env.VITE_AI_API ?? 'http://localhost:3002'
      console.log('Sending research request for', ticker)
      const res = await fetch(`${baseURL}/api/research/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticker: ticker.toUpperCase() }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`Research request failed: ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ') || line === 'data: [DONE]') continue

            let parsed: Record<string, unknown>
            try {
              parsed = JSON.parse(line.slice(6))
            } catch {
              continue
            }

            const { type } = parsed

            if (type === 'agent_start') {
              const agent = parsed.agent as AgentId
              setAgentStates((prev) => ({ ...prev, [agent]: 'running' }))
            } else if (type === 'agent_done') {
              const agent = parsed.agent as AgentId
              setAgentStates((prev) => ({ ...prev, [agent]: 'done' }))
              setAgentData((prev) => ({ ...prev, [agent]: parsed.data }))
            } else if (type === 'agent_error') {
              const agent = parsed.agent as AgentId
              setAgentStates((prev) => ({ ...prev, [agent]: 'error' }))
            } else if (type === 'complete') {
              setReport(parsed.data as ResearchReport)
            } else if (type === 'error') {
              setError(parsed.message as string)
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setIsRunning(false)
    }
  }, [isRunning])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setAgentStates({ ...INITIAL_STATES })
    setAgentData({})
    setReport(null)
    setError(null)
    setIsRunning(false)
  }, [])

  return { agentStates, agentData, report, isRunning, error, runResearch, reset }
}
