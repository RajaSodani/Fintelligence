import { useState } from 'react'
import { Search, Newspaper, BarChart2, MessageSquare, Brain, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { AgentState } from '@/types'

interface Agent {
  id: string
  name: string
  icon: LucideIcon
  color: string
  bg: string
  description: string
  sources: string
  state: AgentState
  result?: string
}

const initialAgents: Agent[] = [
  {
    id: 'news', name: 'News Agent',
    icon: Newspaper, color: 'var(--blue)', bg: 'rgba(77,159,255,0.1)',
    description: 'Scans 500+ news sources, press releases, and regulatory filings for material events',
    sources: 'ET, Bloomberg, Moneycontrol, BSE/NSE Filings',
    state: 'pending',
    result: 'Bullish news flow. 3 positive catalysts identified in last 7 days.',
  },
  {
    id: 'financials', name: 'Financials Agent',
    icon: BarChart2, color: 'var(--green)', bg: 'rgba(0,232,122,0.1)',
    description: 'Pulls latest quarterly results, computes key ratios, and benchmarks against sector peers',
    sources: 'NSE, BSE, Screener.in, Annual Reports',
    state: 'pending',
    result: 'Revenue +23% YoY. ROE 16.8%, above sector avg of 13.2%. NIM improving.',
  },
  {
    id: 'sentiment', name: 'Sentiment Agent',
    icon: MessageSquare, color: 'var(--amber)', bg: 'rgba(245,166,35,0.1)',
    description: 'Analyzes social media chatter, options flow, and FII/DII positioning data',
    sources: 'Twitter/X, Reddit, NSE Options Chain, SEBI Data',
    state: 'pending',
    result: 'FII net buyers ₹8,200Cr this week. Options put-call ratio: 0.72 (bullish).',
  },
  {
    id: 'thesis', name: 'Thesis Agent',
    icon: Brain, color: 'var(--purple)', bg: 'rgba(155,109,255,0.1)',
    description: 'Synthesizes all signals into a structured investment thesis with price target and risk factors',
    sources: 'Powered by Claude — Anthropic AI',
    state: 'pending',
    result: 'BUY — strong fundamentals with improving sentiment. Target ₹1,920 (+18%).',
  },
]

const recentSearches = ['HDFCBANK', 'RELIANCE', 'INFY', 'TCS', 'BAJFINANCE']

const sentimentScores = [
  { label: 'News Sentiment',    score: 72, color: 'var(--green)' },
  { label: 'Social Sentiment',  score: 58, color: 'var(--amber)' },
  { label: 'Analyst Consensus', score: 81, color: 'var(--green)' },
  { label: 'Options Flow',      score: 64, color: 'var(--amber)' },
]

const mockHeadlines = [
  { title: 'HDFC Bank Q4 profit rises 37% YoY, beats Street estimates by 8%',     source: 'Economic Times',    sentiment: 'green', time: '2h ago' },
  { title: 'RBI holds repo rate at 6.5% — 7th consecutive pause',                  source: 'Moneycontrol',      sentiment: 'blue',  time: '4h ago' },
  { title: 'FIIs net buyers of ₹8,200 Cr in equities this week',                   source: 'Business Standard', sentiment: 'green', time: '6h ago' },
  { title: 'HDFC Bank plans to raise ₹7,500 Cr via infrastructure bonds',          source: 'Reuters India',     sentiment: 'amber', time: '1d ago' },
  { title: 'Merger integration progressing ahead of schedule — management',         source: 'CNBC TV18',         sentiment: 'green', time: '2d ago' },
]

export function Research() {
  const [ticker, setTicker]   = useState('')
  const [agents, setAgents]   = useState<Agent[]>(initialAgents)
  const [running, setRunning] = useState(false)
  const [done, setDone]       = useState(false)

  const runResearch = (sym?: string) => {
    const symbol = sym ?? ticker.trim()
    if (!symbol || running) return
    if (sym) setTicker(sym)
    setRunning(true)
    setDone(false)
    setAgents(prev => prev.map(a => ({ ...a, state: 'pending' })))

    const seq = ['news', 'financials', 'sentiment', 'thesis']
    seq.forEach((id, i) => {
      setTimeout(() => setAgents(prev => prev.map(a => a.id === id ? { ...a, state: 'running' } : a)), i * 1300)
      setTimeout(() => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, state: 'done' } : a))
        if (id === 'thesis') { setRunning(false); setDone(true) }
      }, i * 1300 + 1000)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card">
        <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-3">Enter a ticker to analyze</p>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-[var(--bg3)] border border-[var(--border2)] rounded-xl px-4 py-3 focus-within:border-[rgba(0,232,122,0.35)] transition-colors">
            <Search size={18} className="text-[var(--text3)] flex-shrink-0" />
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && runResearch()}
              placeholder="HDFCBANK, RELIANCE, INFY…"
              className="flex-1 font-mono text-[17px] tracking-wider bg-transparent text-[var(--text)] placeholder:text-[var(--text3)] uppercase"
              maxLength={12}
            />
            {ticker && (
              <button onClick={() => setTicker('')} className="text-[var(--text3)] hover:text-[var(--text2)] text-xs font-mono">✕</button>
            )}
          </div>
          <Button variant="primary" size="md" icon={ArrowRight} onClick={() => runResearch()} loading={running}>
            Run Research
          </Button>
        </div>

        {/* Recent searches */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="font-mono text-2xs text-[var(--text3)]">Recent:</span>
          {recentSearches.map(sym => (
            <button
              key={sym}
              onClick={() => runResearch(sym)}
              className="font-mono text-xs px-2.5 py-1 rounded-lg bg-[var(--bg4)] text-[var(--text2)] border border-[var(--border)] hover:border-[var(--border2)] hover:text-[var(--text)] transition-all"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Agent pipeline */}
      <div>
        <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-3">AI Agent Pipeline</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <div
                key={agent.id}
                className={cn(
                  'p-5 rounded-2xl border transition-all duration-300',
                  agent.state === 'running' ? 'border-[rgba(0,232,122,0.4)] bg-[var(--bg2)] agent-running' :
                  agent.state === 'done'    ? 'border-[rgba(0,232,122,0.2)] bg-[var(--bg2)]' :
                  'border-[var(--border)] bg-[var(--bg2)] opacity-55'
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: agent.state !== 'pending' ? agent.bg : 'var(--bg4)' }}
                  >
                    <Icon
                      size={18}
                      className={agent.state !== 'pending' ? '' : 'text-[var(--text3)]'}
                      style={agent.state !== 'pending' ? { color: agent.color } : {}}
                    />
                  </div>
                  {agent.state === 'running' && (
                    <div className="flex items-center gap-1.5">
                      <Loader2 size={12} className="text-[var(--green)] animate-spin" />
                      <span className="font-mono text-2xs text-[var(--green)] tracking-wider">Running</span>
                    </div>
                  )}
                  {agent.state === 'done' && <CheckCircle2 size={16} className="text-[var(--green)]" />}
                  {agent.state === 'pending' && <span className="font-mono text-2xs text-[var(--text3)] tracking-wider">Idle</span>}
                </div>

                <h3 className="font-syne font-bold text-[15px] text-[var(--text)] mb-1">{agent.name}</h3>
                <p className="font-dm text-xs text-[var(--text2)] leading-relaxed mb-3">{agent.description}</p>
                <p className="font-mono text-2xs text-[var(--text3)]">{agent.sources}</p>

                {agent.state === 'done' && agent.result && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] font-mono text-xs text-[var(--green)]">
                    {agent.result}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Report — visible after run */}
      {done && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4">
          {/* Left: full report */}
          <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1">Investment Report</p>
                <h2 className="font-syne font-bold text-[22px] text-[var(--text)]">{ticker || 'HDFCBANK'}</h2>
                <p className="font-dm text-sm text-[var(--text2)]">HDFC Bank Limited · NSE · Banking</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="green" dot className="text-sm px-4 py-1.5">STRONG BUY</Badge>
                <p className="font-mono text-xs text-[var(--text2)]">Target: ₹1,920</p>
              </div>
            </div>

            <div className="h-px bg-[var(--border)]" />

            <div>
              <h3 className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-3">Executive Summary</h3>
              <p className="font-dm text-[15px] text-[var(--text2)] leading-relaxed">
                HDFC Bank continues to demonstrate strong fundamentals with consistent NIM expansion, disciplined credit growth, and improving asset quality post-merger. At 2.6× P/B vs. the sector average of 3.1×, the stock offers a margin of safety. Key re-rating catalyst: full merger synergy disclosure in Q1 FY27 earnings.
              </p>
            </div>

            <div>
              <h3 className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-3">Sentiment Scores</h3>
              <div className="flex flex-col gap-3">
                {sentimentScores.map(({ label, score, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="font-dm text-sm text-[var(--text2)] w-40 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-[var(--bg4)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, background: color }}
                      />
                    </div>
                    <span className="font-mono text-sm w-8 text-right" style={{ color }}>{score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-3">Key Risks</h3>
              <div className="flex flex-col gap-2">
                {[
                  ['Merger integration execution risk — timeline slippage possible', 'amber'],
                  ['MFI book credit cost spike if rural stress persists',            'red'],
                  ['NIM compression risk if rate cycle reverses sharply',             'amber'],
                ].map(([text, color], i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: color === 'red' ? 'rgba(255,77,106,0.06)' : 'rgba(245,166,35,0.06)', border: `1px solid ${color === 'red' ? 'rgba(255,77,106,0.15)' : 'rgba(245,166,35,0.15)'}` }}>
                    <span className="text-xs mt-0.5" style={{ color: `var(--${color})` }}>▲</span>
                    <p className="font-dm text-sm" style={{ color: `var(--${color})` }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border2)]">
              <h3 className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-2">Thesis Verdict</h3>
              <p className="font-dm text-[15px] text-[var(--text2)] leading-relaxed">
                Accumulate on dips. 12-month target ₹1,920 (+18%). Catalyst: Q1 FY27 earnings confirming merger synergy delivery. Stop-loss: ₹1,430 (−11%).
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">
            {/* Financial snapshot */}
            <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card">
              <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-4">Financial Snapshot</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Market Cap',   value: '₹12.8L Cr' },
                  { label: 'P/E Ratio',    value: '19.4×' },
                  { label: 'P/B Ratio',    value: '2.6×' },
                  { label: 'ROE',          value: '16.8%' },
                  { label: 'NIM',          value: '3.52%' },
                  { label: 'GNPA',         value: '1.24%' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
                    <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-wider mb-1.5">{label}</p>
                    <p className="font-syne font-bold text-[18px] text-[var(--text)] leading-none">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Headlines */}
            <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card flex-1">
              <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-4">Recent Headlines</p>
              <div className="flex flex-col gap-3">
                {mockHeadlines.map((h, i) => (
                  <div key={i} className="flex gap-3 pb-3 border-b border-[var(--border)] last:border-0 last:pb-0">
                    <div className="w-1 rounded-full flex-shrink-0 mt-0.5" style={{ background: `var(--${h.sentiment})`, minHeight: 40 }} />
                    <div className="flex-1">
                      <p className="font-dm text-[14px] text-[var(--text)] leading-snug">{h.title}</p>
                      <p className="font-mono text-2xs text-[var(--text3)] mt-1.5">{h.source} · {h.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
