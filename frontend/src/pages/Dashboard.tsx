import { useState, useEffect, useRef } from 'react'
import { Send, ArrowUpRight, Bot } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SpendingDonut } from '@/components/charts/SpendingDonut'
import { useTransactions } from '@/hooks/useTransactions'
import { useTransactionSummary } from '@/hooks/useTransactionSummary'
import { useChat } from '@/hooks/useChat'
import { cn, formatCompact } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining':      'var(--green)',
  'Shopping':           'var(--blue)',
  'Transport':          'var(--amber)',
  'Subscriptions':      'var(--red)',
  'Income':             'var(--purple)',
  'Utilities':          'var(--text2)',
  'Housing & Finance':  'var(--gold)',
  'Health':             '#0ea5e9',
  'Other':              'var(--text3)',
}

const NET_WORTH_TREND = [
  { month: 'Nov', value: 3820000 },
  { month: 'Dec', value: 3960000 },
  { month: 'Jan', value: 4050000 },
  { month: 'Feb', value: 4120000 },
  { month: 'Mar', value: 4380000 },
  { month: 'Apr', value: 4540000 },
  { month: 'May', value: 4860000 },
]

function WorthTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg3)] border border-[var(--border2)] rounded-xl px-3 py-2 shadow-card">
      <p className="font-mono text-2xs text-[var(--text3)] mb-0.5">{label}</p>
      <p className="num text-[15px] text-[var(--text)]">{formatCompact(payload[0].value)}</p>
    </div>
  )
}

export function Dashboard() {
  const [input, setInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { transactions, loading: txLoading } = useTransactions({ limit: 8 })
  const { byCategory, comparison, loading: summaryLoading } = useTransactionSummary()

  const donutData = byCategory
    .filter((c) => c.category !== 'Income')
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)
    .map((c) => ({ category: c.category, amount: c.total, color: CATEGORY_COLORS[c.category] ?? 'var(--text3)' }))

  const { messages, sendMessage, isTyping } = useChat({
    transactionsContext: transactions.slice(0, 30).map((t) => ({
      name: t.name, amount: t.amount, category: t.category, date: t.date,
    })),
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  const monthlySpend = comparison?.thisMonth ?? 0
  const changePercent = comparison?.changePercent ?? 0

  return (
    <div className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Net Worth"
          value={formatCompact(4_860_000)}
          change="+4.8% this month"
          changeType="up"
          sub="↑ ₹2.1L from April"
          accent
        />
        <StatCard
          label="Monthly Spend"
          value={summaryLoading ? '...' : formatCompact(monthlySpend)}
          change={`${changePercent > 0 ? '+' : ''}${changePercent}% vs last month`}
          changeType={changePercent > 0 ? 'down' : 'up'}
          sub={`Budget: ${formatCompact(30_000)}`}
        />
        <StatCard
          label="Transactions"
          value={summaryLoading ? '...' : String(transactions.length)}
          change="this month"
          changeType="neutral"
          sub="Across all accounts"
        />
        <StatCard
          label="Top Category"
          value={donutData[0]?.category ?? '—'}
          change={donutData[0] ? formatCompact(donutData[0].amount) : ''}
          changeType="neutral"
          sub="Highest spend"
        />
      </div>

      {/* Net worth chart + spending breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Net worth trend */}
        <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1">Net Worth Trend</p>
              <p className="num text-[28px] text-[var(--text)]">{formatCompact(4_860_000)}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <ArrowUpRight size={13} className="text-[var(--green)]" />
                <span className="font-mono text-xs text-[var(--green)]">+₹10.4L since Nov 2024</span>
              </div>
            </div>
            <Badge variant="green" dot>+27.2% YTD</Badge>
          </div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={NET_WORTH_TREND} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00e87a" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#00e87a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<WorthTooltip />} cursor={{ stroke: 'var(--border2)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="value" stroke="#00e87a" strokeWidth={2.5} fill="url(#nwGrad)" dot={false} activeDot={{ r: 4, fill: '#00e87a', stroke: 'var(--bg)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending breakdown */}
        <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card">
          <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-4">Spending Breakdown</p>
          {summaryLoading ? (
            <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
          ) : donutData.length === 0 ? (
            <EmptyState title="No spending data yet" description="Connect your bank to see a breakdown" />
          ) : (
            <SpendingDonut data={donutData} />
          )}
        </div>
      </div>

      {/* Transactions + AI Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
        {/* Transactions */}
        <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border)]">
            <p className="font-syne font-bold text-[15px] text-[var(--text)]">Recent Transactions</p>
            <button className="font-mono text-xs text-[var(--green)] hover:underline">View all</button>
          </div>

          {txLoading ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Connect your bank account to see transactions"
            />
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {transactions.map((tx) => {
                const isCredit = tx.amount < 0
                const displayAmount = Math.abs(tx.amount)
                return (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg3)] transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{
                        background: isCredit ? 'rgba(0,232,122,0.1)' : 'var(--bg4)',
                        color: isCredit ? 'var(--green)' : (CATEGORY_COLORS[tx.category ?? ''] ?? 'var(--text2)'),
                      }}
                    >
                      {(tx.merchantName ?? tx.name).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-dm text-[15px] font-medium text-[var(--text)] truncate">{tx.name}</p>
                      <p className="font-mono text-xs text-[var(--text3)]">
                        {tx.category ?? 'Other'} · {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-mono text-[15px] font-medium', isCredit ? 'text-[var(--green)]' : 'text-[var(--text)]')}>
                        {isCredit ? '+' : '−'}₹{displayAmount.toLocaleString('en-IN')}
                      </p>
                      {tx.pending && <Badge variant="muted" className="mt-0.5">pending</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card flex flex-col" style={{ minHeight: 480 }}>
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[rgba(0,232,122,0.2)] to-[rgba(77,159,255,0.2)] flex items-center justify-center">
              <Bot size={17} className="text-[var(--green)]" />
            </div>
            <div>
              <p className="font-syne font-bold text-[15px] text-[var(--text)] leading-tight">AI Financial Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                <span className="font-mono text-2xs text-[var(--green)]">Online</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
            {messages.length === 0 && !isTyping && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-[var(--text3)] text-center">Ask me anything about your finances.<br />I have context on your recent transactions.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg4)] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Bot size={13} className="text-[var(--green)]" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[82%] px-4 py-3 rounded-2xl font-dm text-[14px] leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[rgba(0,232,122,0.1)] border border-[rgba(0,232,122,0.18)] text-[var(--text)] rounded-tr-sm'
                      : 'bg-[var(--bg3)] border border-[var(--border2)] text-[var(--text2)] rounded-tl-sm'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg4)] flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-[var(--green)]" />
                </div>
                <div className="bg-[var(--bg3)] border border-[var(--border2)] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--text3)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex gap-2 items-center bg-[var(--bg3)] border border-[var(--border2)] rounded-xl px-4 py-2.5 focus-within:border-[rgba(0,232,122,0.35)] transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask anything about your money…"
                className="flex-1 bg-transparent text-[15px] text-[var(--text)] placeholder:text-[var(--text3)] font-dm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50"
                style={{ background: input.trim() ? 'var(--green)' : 'var(--bg4)' }}
              >
                <Send size={14} color={input.trim() ? '#07090f' : 'var(--text3)'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
