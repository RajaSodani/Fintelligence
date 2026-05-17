import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Plus, Bell, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { OHLCChart } from '@/components/charts/OHLCChart'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useWatchlist } from '@/hooks/useWatchlist'
import { useAlerts } from '@/hooks/useAlerts'
import { useMarketStrip } from '@/hooks/useMarketData'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import type { Holding, WatchlistItem, PriceAlert } from '@/types'

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data.length) return <div className="w-[72px] h-[32px]" />
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const w = 72, h = 32
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ')
  const id = `sg-${up ? 'up' : 'dn'}-${data[0]}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? '#00e87a' : '#ff4d6a'} stopOpacity={0.25} />
          <stop offset="100%" stopColor={up ? '#00e87a' : '#ff4d6a'} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={up ? 'var(--green)' : 'var(--red)'} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ─── Market Strip ─────────────────────────────────────────────────────────────

function MarketStrip() {
  const { quotes, loading } = useMarketStrip(30_000)

  if (loading && !quotes.length) return (
    <div className="rounded-2xl border border-[var(--border2)] bg-[var(--bg2)] px-5 py-3 flex items-center gap-3">
      <LoadingSpinner size="sm" />
      <span className="font-mono text-xs text-[var(--text3)]">Loading market data…</span>
    </div>
  )

  return (
    <div className="rounded-2xl border border-[var(--border2)] bg-[var(--bg2)] overflow-hidden">
      <div className="flex items-center gap-6 px-5 py-3 overflow-x-auto no-scrollbar">
        {quotes.map((q) => {
          const up = q.changePercent >= 0
          return (
            <div key={q.ticker} className="flex items-center gap-3 flex-shrink-0">
              <div>
                <p className="font-mono text-[13px] font-medium text-[var(--text)] whitespace-nowrap">{q.ticker}</p>
                <p className="font-mono text-2xs text-[var(--text3)] whitespace-nowrap truncate max-w-[110px]">{q.companyName}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[13px] text-[var(--text)]">
                  {q.ticker.startsWith('^') ? q.price.toLocaleString('en-IN') : `₹${q.price.toLocaleString('en-IN')}`}
                </p>
                <p className={cn('font-mono text-2xs', up ? 'text-[var(--green)]' : 'text-[var(--red)]')}>
                  {up ? '+' : ''}{q.changePercent.toFixed(2)}%
                </p>
              </div>
              {q !== quotes[quotes.length - 1] && (
                <div className="w-px h-8 bg-[var(--border)] flex-shrink-0 ml-3" />
              )}
            </div>
          )
        })}
        <span className="font-mono text-2xs text-[var(--text3)] flex-shrink-0 ml-auto">Refreshes every 30s</span>
      </div>
    </div>
  )
}

// ─── Add Holding Modal ────────────────────────────────────────────────────────

function AddHoldingModal({ onAdd, onClose }: {
  onAdd: (ticker: string, qty: number, price: number) => Promise<void>
  onClose: () => void
}) {
  const [ticker, setTicker]   = useState('')
  const [qty, setQty]         = useState('')
  const [price, setPrice]     = useState('')
  const [adding, setAdding]   = useState(false)
  const [err, setErr]         = useState('')

  const handleSubmit = async () => {
    if (!ticker.trim() || !qty || !price) { setErr('All fields required'); return }
    const q = parseFloat(qty), p = parseFloat(price)
    if (isNaN(q) || isNaN(p) || q <= 0 || p <= 0) { setErr('Enter valid numbers'); return }
    setAdding(true)
    try {
      await onAdd(ticker.trim().toUpperCase(), q, p)
      onClose()
    } catch {
      setErr('Failed to add holding')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,9,15,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-6 w-full max-w-sm shadow-card">
        <div className="flex items-center justify-between mb-5">
          <p className="font-syne font-bold text-[16px] text-[var(--text)]">Add Holding</p>
          <button onClick={onClose} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Ticker', value: ticker, set: setTicker, placeholder: 'e.g. RELIANCE, TCS, INFY' },
            { label: 'Quantity', value: qty, set: setQty, placeholder: 'e.g. 10' },
            { label: 'Avg Buy Price (₹)', value: price, set: setPrice, placeholder: 'e.g. 2800' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1.5">{label}</p>
              <input
                value={value}
                onChange={(e) => { set(e.target.value); setErr('') }}
                placeholder={placeholder}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 font-dm text-[15px] text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[rgba(0,232,122,0.35)] outline-none transition-colors"
              />
            </div>
          ))}
          {err && <p className="font-mono text-xs text-[var(--red)]">{err}</p>}
          <Button variant="primary" size="md" loading={adding} onClick={handleSubmit}>Add Holding</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Alert Modal ───────────────────────────────────────────────────────

function CreateAlertModal({ onCreate, onClose }: {
  onCreate: (ticker: string, targetPrice: number, condition: 'ABOVE' | 'BELOW') => Promise<void>
  onClose: () => void
}) {
  const [ticker, setTicker]       = useState('')
  const [price, setPrice]         = useState('')
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE')
  const [creating, setCreating]   = useState(false)
  const [err, setErr]             = useState('')

  const handleSubmit = async () => {
    if (!ticker.trim() || !price) { setErr('All fields required'); return }
    const p = parseFloat(price)
    if (isNaN(p) || p <= 0) { setErr('Enter a valid price'); return }
    setCreating(true)
    try {
      await onCreate(ticker.trim().toUpperCase(), p, condition)
      onClose()
    } catch {
      setErr('Failed to create alert')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,9,15,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-6 w-full max-w-sm shadow-card">
        <div className="flex items-center justify-between mb-5">
          <p className="font-syne font-bold text-[16px] text-[var(--text)]">Set Price Alert</p>
          <button onClick={onClose} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors"><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1.5">Ticker</p>
            <input
              value={ticker}
              onChange={(e) => { setTicker(e.target.value); setErr('') }}
              placeholder="e.g. TCS, RELIANCE, INFY"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 font-dm text-[15px] text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[rgba(0,232,122,0.35)] outline-none transition-colors"
            />
          </div>
          <div>
            <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1.5">Condition</p>
            <div className="flex gap-2">
              {(['ABOVE', 'BELOW'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl font-mono text-sm font-medium transition-all',
                    condition === c
                      ? c === 'ABOVE' ? 'bg-[rgba(0,232,122,0.15)] border border-[rgba(0,232,122,0.35)] text-[var(--green)]'
                                      : 'bg-[rgba(255,77,106,0.12)] border border-[rgba(255,77,106,0.3)] text-[var(--red)]'
                      : 'bg-[var(--bg3)] border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--bg4)]',
                  )}
                >
                  {c === 'ABOVE' ? '↑ Above' : '↓ Below'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1.5">Target Price (₹)</p>
            <input
              value={price}
              onChange={(e) => { setPrice(e.target.value); setErr('') }}
              placeholder="e.g. 3000"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 font-dm text-[15px] text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[rgba(0,232,122,0.35)] outline-none transition-colors"
            />
          </div>
          {err && <p className="font-mono text-xs text-[var(--red)]">{err}</p>}
          <Button variant="primary" size="md" loading={creating} onClick={handleSubmit}>Create Alert</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Holdings Table ───────────────────────────────────────────────────────────

function HoldingsTable({
  holdings,
  onRowClick,
  onDelete,
}: {
  holdings: Holding[]
  onRowClick: (ticker: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {['Ticker', 'Company', 'Qty', 'Avg Cost', 'LTP', 'P&L', '7d Chart', ''].map((col) => (
              <th key={col} className="px-4 py-3 text-left font-mono text-2xs text-[var(--text3)] uppercase tracking-wider whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr
              key={h.id}
              className="border-b border-[var(--border)] hover:bg-[var(--bg3)] transition-colors group cursor-pointer"
              onClick={() => onRowClick(h.ticker)}
            >
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg4)] flex items-center justify-center flex-shrink-0">
                    <span className="font-syne font-bold text-[10px] text-[var(--text2)]">{h.ticker[0]}</span>
                  </div>
                  <span className="font-mono text-[14px] font-medium text-[var(--text)]">{h.ticker}</span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-dm text-[13px] text-[var(--text2)] whitespace-nowrap">{h.companyName}</span>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-mono text-[14px] text-[var(--text)]">{h.quantity}</span>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-mono text-[14px] text-[var(--text2)]">{formatCurrency(h.avgBuyPrice)}</span>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-mono text-[14px] font-medium text-[var(--text)]">{formatCurrency(h.ltp)}</span>
              </td>
              <td className="px-4 py-3.5">
                <p className={cn('font-mono text-[14px] font-medium leading-tight', h.pnl >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')}>
                  {h.pnl >= 0 ? '+' : '−'}{formatCurrency(Math.abs(h.pnl))}
                </p>
                <p className={cn('font-mono text-xs mt-0.5', h.pnl >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')} style={{ opacity: 0.75 }}>
                  {formatPercent(h.pnlPercent)}
                </p>
              </td>
              <td className="px-4 py-3.5">
                <Sparkline data={h.sparkline} up={h.pnl >= 0} />
              </td>
              <td className="px-4 py-3.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(h.id) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text3)] hover:text-[var(--red)]"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Watchlist Panel ──────────────────────────────────────────────────────────

function WatchlistPanel({
  items,
  onRowClick,
  onRemove,
  onAdd,
}: {
  items: WatchlistItem[]
  onRowClick: (ticker: string) => void
  onRemove: (id: string) => void
  onAdd: (ticker: string) => void
}) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const t = input.trim()
    if (!t) return
    onAdd(t)
    setInput('')
  }

  return (
    <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <p className="font-syne font-bold text-[15px] text-[var(--text)]">Watchlist</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg3)] transition-colors cursor-pointer group"
            onClick={() => onRowClick(item.ticker)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[14px] font-medium text-[var(--text)]">{item.ticker}</p>
              <p className="font-dm text-xs text-[var(--text3)] truncate">{item.companyName}</p>
            </div>
            <Sparkline data={item.sparkline} up={item.change >= 0} />
            <div className="text-right">
              <p className="font-mono text-[14px] font-medium text-[var(--text)]">{formatCurrency(item.price)}</p>
              <p className={cn('font-mono text-xs', item.change >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')}>
                {formatPercent(item.changePercent)}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(item.id) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text3)] hover:text-[var(--red)]"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="font-mono text-xs text-[var(--text3)] px-5 py-4">No tickers added yet.</p>
        )}
      </div>
      <div className="px-5 py-3 border-t border-[var(--border)] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add ticker (e.g. WIPRO, TITAN)"
          className="flex-1 bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3 py-2 font-mono text-xs text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[rgba(0,232,122,0.35)] outline-none transition-colors"
        />
        <Button variant="ghost" size="sm" icon={Plus} onClick={handleAdd}>Add</Button>
      </div>
    </div>
  )
}

// ─── Alerts Panel ─────────────────────────────────────────────────────────────

function AlertsPanel({ alerts, onDelete }: { alerts: PriceAlert[]; onDelete: (id: string) => void }) {
  return (
    <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <p className="font-syne font-bold text-[15px] text-[var(--text)]">Price Alerts</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {alerts.map((alert) => {
          const distPct = alert.distancePercent ?? 0
          const up = alert.condition === 'ABOVE'
          return (
            <div key={alert.id} className="px-5 py-4 hover:bg-[var(--bg3)] transition-colors group">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[14px] font-medium text-[var(--text)]">{alert.ticker}</span>
                    {alert.isTriggered ? (
                      <Badge variant="green" dot>Triggered</Badge>
                    ) : (
                      <Badge variant={up ? 'blue' : 'amber'} dot>{alert.condition}</Badge>
                    )}
                  </div>
                  <p className="font-dm text-xs text-[var(--text3)]">
                    Target: {formatCurrency(alert.targetPrice)} · Current: {formatCurrency(alert.currentPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!alert.isTriggered && (
                    <p className="font-mono text-xs text-[var(--text3)]">{distPct.toFixed(1)}% away</p>
                  )}
                  <button
                    onClick={() => onDelete(alert.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text3)] hover:text-[var(--red)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {!alert.isTriggered && (
                <div className="h-1 bg-[var(--bg4)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(4, Math.min(100, 100 - distPct * 3))}%`,
                      background: up ? 'var(--blue)' : 'var(--amber)',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
        {alerts.length === 0 && (
          <p className="font-mono text-xs text-[var(--text3)] px-5 py-4">No alerts set.</p>
        )}
      </div>
    </div>
  )
}

// ─── Market page ──────────────────────────────────────────────────────────────

export function Market() {
  const navigate = useNavigate()
  const portfolio  = usePortfolio()
  const watchlist  = useWatchlist()
  const alertsHook = useAlerts()

  const [showAddHolding, setShowAddHolding]   = useState(false)
  const [showAddAlert, setShowAddAlert]       = useState(false)
  const [chartTicker, setChartTicker]         = useState<string | null>(null)

  const { holdings, totalValue, totalPnl, totalPnlPercent, dayPnl, loading: pLoading } = portfolio

  const handleTickerClick = (ticker: string) => setChartTicker(ticker)

  const handleResearch = (ticker: string) => {
    navigate(`/research?ticker=${encodeURIComponent(ticker)}`)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Market strip */}
      <MarketStrip />

      {/* Portfolio hero */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)', border: '1px solid var(--border2)' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 85% 50%, rgba(0,232,122,0.06) 0%, transparent 60%)' }} />
        <div className="relative flex flex-wrap items-end gap-8">
          <div>
            <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1">Portfolio Value</p>
            <p className="font-syne font-extrabold text-[40px] text-[var(--text)] leading-none">
              {pLoading ? '…' : `₹${(totalValue / 100000).toFixed(2)}L`}
            </p>
          </div>

          <div className="flex gap-6 mb-1">
            {[
              { label: 'Day P&L',       value: dayPnl,          up: dayPnl >= 0 },
              { label: 'Total Return',  value: totalPnlPercent, up: totalPnlPercent >= 0, isPercent: true },
              { label: 'Unrealized P&L',value: totalPnl,        up: totalPnl >= 0 },
            ].map(({ label, value, up, isPercent }) => (
              <div key={label}>
                <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-wider mb-1">{label}</p>
                <div className="flex items-center gap-1.5">
                  {up ? <TrendingUp size={14} className="text-[var(--green)]" /> : <TrendingDown size={14} className="text-[var(--red)]" />}
                  <span className={cn('font-mono text-[16px] font-medium', up ? 'text-[var(--green)]' : 'text-[var(--red)]')}>
                    {isPercent
                      ? `${up ? '+' : ''}${value.toFixed(2)}%`
                      : `${up ? '+' : '−'}${formatCurrency(Math.abs(value))}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowAddHolding(true)}>Add Holding</Button>
            <Button variant="ghost" size="sm" icon={Bell} onClick={() => setShowAddAlert(true)}>Set Alert</Button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        {/* Holdings table */}
        <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <p className="font-syne font-bold text-[15px] text-[var(--text)]">
              Holdings {pLoading ? '' : `(${holdings.length})`}
            </p>
          </div>
          {pLoading ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
          ) : holdings.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No holdings yet"
              description="Add your first holding to start tracking your portfolio"
              action={<Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowAddHolding(true)}>Add Holding</Button>}
            />
          ) : (
            <HoldingsTable
              holdings={holdings}
              onRowClick={(ticker) => handleTickerClick(ticker)}
              onDelete={(id) => portfolio.deleteHolding(id)}
            />
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Watchlist */}
          {watchlist.loading ? (
            <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl flex items-center justify-center py-8 shadow-card">
              <LoadingSpinner />
            </div>
          ) : (
            <WatchlistPanel
              items={watchlist.items}
              onRowClick={handleTickerClick}
              onRemove={(id) => watchlist.removeTicker(id)}
              onAdd={(ticker) => watchlist.addTicker(ticker)}
            />
          )}

          {/* Price Alerts */}
          {alertsHook.loading ? (
            <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl flex items-center justify-center py-8 shadow-card">
              <LoadingSpinner />
            </div>
          ) : (
            <AlertsPanel
              alerts={alertsHook.alerts}
              onDelete={(id) => alertsHook.deleteAlert(id)}
            />
          )}

          {/* Chart for selected ticker */}
          {chartTicker && (
            <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-1">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResearch(chartTicker)}
                    className="font-mono text-xs text-[var(--green)] hover:underline"
                  >
                    Open in Research →
                  </button>
                </div>
                <button onClick={() => setChartTicker(null)} className="text-[var(--text3)] hover:text-[var(--text)]">
                  <X size={15} />
                </button>
              </div>
              <OHLCChart ticker={chartTicker} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddHolding && (
        <AddHoldingModal
          onAdd={(ticker, qty, price) => portfolio.addHolding(ticker, qty, price)}
          onClose={() => setShowAddHolding(false)}
        />
      )}
      {showAddAlert && (
        <CreateAlertModal
          onCreate={(ticker, price, condition) => alertsHook.createAlert(ticker, price, condition)}
          onClose={() => setShowAddAlert(false)}
        />
      )}

    </div>
  )
}
