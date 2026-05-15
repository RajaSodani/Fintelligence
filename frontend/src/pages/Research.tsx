import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Newspaper, BarChart2, MessageSquare, Brain, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { AgentState } from '@/types'
import { useResearch } from '@/hooks/useResearch'
import type { SentimentScore } from '@/hooks/useResearch'

interface AgentMeta {
  id: string
  name: string
  icon: LucideIcon
  color: string
  bg: string
  description: string
  sources: string
}

const AGENT_META: AgentMeta[] = [
  {
    id: 'news',
    name: 'News Agent',
    icon: Newspaper,
    color: 'var(--blue)',
    bg: 'rgba(77,159,255,0.1)',
    description: 'Scans 500+ news sources, press releases, and regulatory filings for material events',
    sources: 'Yahoo Finance · NSE · BSE · Reuters',
  },
  {
    id: 'financials',
    name: 'Financials Agent',
    icon: BarChart2,
    color: 'var(--green)',
    bg: 'rgba(0,232,122,0.1)',
    description: 'Pulls live price, market cap, P/E, P/B, ROE and full fundamentals for NSE/BSE/US stocks',
    sources: 'Yahoo Finance · NSE · BSE · NASDAQ',
  },
  {
    id: 'sentiment',
    name: 'Sentiment Agent',
    icon: MessageSquare,
    color: 'var(--amber)',
    bg: 'rgba(245,166,35,0.1)',
    description: 'Synthesizes news tone, analyst signals, and market positioning into a sentiment score',
    sources: 'Powered by GPT-4o · News Analysis',
  },
  {
    id: 'thesis',
    name: 'Thesis Agent',
    icon: Brain,
    color: 'var(--purple)',
    bg: 'rgba(155,109,255,0.1)',
    description: 'Synthesizes all signals into a structured investment thesis with price target and risk factors',
    sources: 'Powered by GPT-4o · Multi-signal synthesis',
  },
]

const RECENT_SEARCHES = ['HDFCBANK', 'RELIANCE', 'INFY', 'TCS', 'BAJFINANCE']

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--green)'
  if (score >= 45) return 'var(--amber)'
  return 'var(--red)'
}

function ratingVariant(rating: string): 'green' | 'amber' | 'red' | 'blue' {
  if (rating.includes('BUY')) return 'green'
  if (rating.includes('SELL')) return 'red'
  return 'amber'
}

export function Research() {
  const [searchParams] = useSearchParams()
  const [ticker, setTicker] = useState(() => searchParams.get('ticker') ?? '')
  const { agentStates, agentData, report, isRunning, error, runResearch, reset } = useResearch()

  useEffect(() => {
    const t = searchParams.get('ticker')
    if (t && t !== ticker) setTicker(t)
  }, [searchParams])

  const isDone = agentStates.thesis === 'done'

  const handleRun = (sym?: string) => {
    const symbol = sym ?? ticker.trim()
    if (!symbol || isRunning) return
    if (sym) setTicker(sym)
    runResearch(symbol)
  }

  const handleClear = () => {
    setTicker('')
    reset()
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
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="HDFCBANK, RELIANCE, INFY…"
              className="flex-1 font-mono text-[17px] tracking-wider bg-transparent text-[var(--text)] placeholder:text-[var(--text3)] uppercase"
              maxLength={12}
            />
            {ticker && (
              <button onClick={handleClear} className="text-[var(--text3)] hover:text-[var(--text2)] text-xs font-mono">
                ✕
              </button>
            )}
          </div>
          <Button variant="primary" size="md" icon={ArrowRight} onClick={() => handleRun()} loading={isRunning}>
            Run Research
          </Button>
        </div>

        {/* Recent searches */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="font-mono text-2xs text-[var(--text3)]">Recent:</span>
          {RECENT_SEARCHES.map((sym) => (
            <button
              key={sym}
              onClick={() => handleRun(sym)}
              className="font-mono text-xs px-2.5 py-1 rounded-lg bg-[var(--bg4)] text-[var(--text2)] border border-[var(--border)] hover:border-[var(--border2)] hover:text-[var(--text)] transition-all"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(255,77,106,0.08)] border border-[rgba(255,77,106,0.2)]">
          <AlertCircle size={16} className="text-[var(--red)] flex-shrink-0" />
          <p className="font-dm text-sm text-[var(--red)]">{error}</p>
        </div>
      )}

      {/* Agent pipeline */}
      <div>
        <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-3">AI Agent Pipeline</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {AGENT_META.map((meta) => {
            const state: AgentState = agentStates[meta.id as keyof typeof agentStates] ?? 'pending'
            const data = agentData[meta.id as keyof typeof agentData] as { result_label?: string } | undefined
            const Icon = meta.icon

            return (
              <div
                key={meta.id}
                className={cn(
                  'p-5 rounded-2xl border transition-all duration-300',
                  state === 'running' ? 'border-[rgba(0,232,122,0.4)] bg-[var(--bg2)] agent-running' :
                  state === 'done'    ? 'border-[rgba(0,232,122,0.2)] bg-[var(--bg2)]' :
                  state === 'error'   ? 'border-[rgba(255,77,106,0.3)] bg-[var(--bg2)]' :
                  'border-[var(--border)] bg-[var(--bg2)] opacity-55',
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: state !== 'pending' ? meta.bg : 'var(--bg4)' }}
                  >
                    <Icon
                      size={18}
                      className={state !== 'pending' ? '' : 'text-[var(--text3)]'}
                      style={state !== 'pending' ? { color: meta.color } : {}}
                    />
                  </div>
                  {state === 'running' && (
                    <div className="flex items-center gap-1.5">
                      <Loader2 size={12} className="text-[var(--green)] animate-spin" />
                      <span className="font-mono text-2xs text-[var(--green)] tracking-wider">Running</span>
                    </div>
                  )}
                  {state === 'done' && <CheckCircle2 size={16} className="text-[var(--green)]" />}
                  {state === 'error' && <AlertCircle size={16} className="text-[var(--red)]" />}
                  {state === 'pending' && <span className="font-mono text-2xs text-[var(--text3)] tracking-wider">Idle</span>}
                </div>

                <h3 className="font-syne font-bold text-[15px] text-[var(--text)] mb-1">{meta.name}</h3>
                <p className="font-dm text-xs text-[var(--text2)] leading-relaxed mb-3">{meta.description}</p>
                <p className="font-mono text-2xs text-[var(--text3)]">{meta.sources}</p>

                {state === 'done' && data?.result_label && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] font-mono text-xs text-[var(--green)]">
                    {data.result_label}
                  </div>
                )}
                {state === 'error' && (
                  <div className="mt-3 pt-3 border-t border-[rgba(255,77,106,0.2)] font-mono text-xs text-[var(--red)]">
                    Agent failed — results may be partial
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Report — visible after thesis completes */}
      {isDone && report && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4">
          {/* Left: investment report */}
          <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1">Investment Report</p>
                <h2 className="font-syne font-bold text-[22px] text-[var(--text)]">{report.ticker}</h2>
                {report.financials_data && (
                  <p className="font-dm text-sm text-[var(--text2)]">
                    {report.financials_data.company_name} · {report.financials_data.exchange} · {report.financials_data.sector}
                  </p>
                )}
              </div>
              {report.thesis_data && (
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={ratingVariant(report.thesis_data.rating)} dot className="text-sm px-4 py-1.5">
                    {report.thesis_data.rating}
                  </Badge>
                  <p className="font-mono text-xs text-[var(--text2)]">Target: {report.thesis_data.target_price}</p>
                </div>
              )}
            </div>

            <div className="h-px bg-[var(--border)]" />

            {report.thesis_data && (
              <div>
                <h3 className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-3">Executive Summary</h3>
                <p className="font-dm text-[15px] text-[var(--text2)] leading-relaxed">{report.thesis_data.summary}</p>
              </div>
            )}

            {report.sentiment_data && report.sentiment_data.scores.length > 0 && (
              <div>
                <h3 className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-3">Sentiment Scores</h3>
                <div className="flex flex-col gap-3">
                  {(report.sentiment_data.scores as SentimentScore[]).map(({ label, score }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="font-dm text-sm text-[var(--text2)] w-40 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 bg-[var(--bg4)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${score}%`, background: scoreColor(score) }}
                        />
                      </div>
                      <span className="font-mono text-sm w-8 text-right" style={{ color: scoreColor(score) }}>
                        {score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.thesis_data && report.thesis_data.risks.length > 0 && (
              <div>
                <h3 className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-3">Key Risks</h3>
                <div className="flex flex-col gap-2">
                  {report.thesis_data.risks.map((risk, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                      style={{
                        background: risk.severity === 'red' ? 'rgba(255,77,106,0.06)' : 'rgba(245,166,35,0.06)',
                        border: `1px solid ${risk.severity === 'red' ? 'rgba(255,77,106,0.15)' : 'rgba(245,166,35,0.15)'}`,
                      }}
                    >
                      <span className="text-xs mt-0.5" style={{ color: `var(--${risk.severity})` }}>▲</span>
                      <p className="font-dm text-sm" style={{ color: `var(--${risk.severity})` }}>{risk.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.thesis_data && (
              <div className="p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border2)]">
                <h3 className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-2">Thesis Verdict</h3>
                <p className="font-dm text-[15px] text-[var(--text2)] leading-relaxed">{report.thesis_data.verdict}</p>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">
            {/* Financial snapshot */}
            {report.financials_data && report.financials_data.snapshot.length > 0 && (
              <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card">
                <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-4">Financial Snapshot</p>
                <div className="grid grid-cols-2 gap-3">
                  {report.financials_data.snapshot.map(({ label, value }) => (
                    <div key={label} className="p-3.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
                      <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-wider mb-1.5">{label}</p>
                      <p className="num text-[var(--text)] font-bold text-[18px]eading-none">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Headlines */}
            {report.news_data && report.news_data.headlines.length > 0 && (
              <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card flex-1">
                <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-4">Recent Headlines</p>
                <div className="flex flex-col gap-3">
                  {report.news_data.headlines.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex gap-3 pb-3 border-b border-[var(--border)] last:border-0 last:pb-0">
                      <div
                        className="w-1 rounded-full flex-shrink-0 mt-0.5"
                        style={{ background: `var(--${h.sentiment})`, minHeight: 40 }}
                      />
                      <div className="flex-1">
                        {h.url ? (
                          <a
                            href={h.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-dm text-[14px] text-[var(--text)] leading-snug hover:text-[var(--green)] transition-colors"
                          >
                            {h.title}
                          </a>
                        ) : (
                          <p className="font-dm text-[14px] text-[var(--text)] leading-snug">{h.title}</p>
                        )}
                        <p className="font-mono text-2xs text-[var(--text3)] mt-1.5">
                          {h.source} · {h.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
