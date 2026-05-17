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
  id: string
  ticker: string
  companyName: string
  quantity: number
  avgBuyPrice: number
  ltp: number
  currentValue: number
  pnl: number
  pnlPercent: number
  dayChange: number
  changePercent: number
  sparkline: number[]
}

export interface WatchlistItem {
  id: string
  ticker: string
  companyName: string
  price: number
  change: number
  changePercent: number
  sparkline: number[]
}

export interface PriceAlert {
  id: string
  ticker: string
  condition: 'ABOVE' | 'BELOW'
  targetPrice: number
  currentPrice: number
  distancePercent: number | null
  isTriggered: boolean
  triggeredAt: string | null
  createdAt: string
}

export interface PortfolioSummary {
  holdings: Holding[]
  totalValue: number
  totalPnl: number
  totalPnlPercent: number
  dayPnl: number
}

export interface MarketQuote {
  ticker: string
  companyName: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  marketCap: number | null
}

export interface OHLCPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
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
