export interface Transaction {
  id: string
  name: string
  category: string
  amount: number
  currency: string
  date: string
  icon: string
  type: 'debit' | 'credit'
}

export interface Holding {
  ticker: string
  name: string
  qty: number
  avgCost: number
  ltp: number
  pnl: number
  pnlPercent: number
  sparkline: number[]
}

export interface WatchlistItem {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  sparkline: number[]
}

export interface PriceAlert {
  id: string
  ticker: string
  condition: string
  targetPrice: number
  currentPrice: number
  status: 'NEAR' | 'WATCH' | 'RISK'
}

export type AgentState = 'pending' | 'running' | 'done' | 'error'

export interface AgentStatus {
  id: string
  name: string
  icon: string
  description: string
  sources: string
  state: AgentState
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: string
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  imageUrl?: string
}
