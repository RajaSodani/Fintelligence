import { TrendingUp, TrendingDown, Plus, Bell } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Holding, WatchlistItem, PriceAlert } from '@/types'

const mockHoldings: Holding[] = [
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd',        qty: 50,  avgCost: 1480,  ltp: 1628,  pnl: 7400,   pnlPercent: 10.00,  sparkline: [1480,1510,1490,1540,1555,1590,1628] },
  { ticker: 'INFY',     name: 'Infosys Ltd',           qty: 30,  avgCost: 1780,  ltp: 1642,  pnl: -4140,  pnlPercent: -7.75,  sparkline: [1780,1750,1720,1690,1660,1648,1642] },
  { ticker: 'RELIANCE', name: 'Reliance Industries',  qty: 20,  avgCost: 2640,  ltp: 2890,  pnl: 5000,   pnlPercent: 9.47,   sparkline: [2640,2680,2730,2760,2800,2850,2890] },
  { ticker: 'GOLDBEES', name: 'Nippon Gold ETF',      qty: 100, avgCost: 56.4,  ltp: 61.2,  pnl: 480,    pnlPercent: 8.51,   sparkline: [56.4,57.2,57.8,58.5,59.2,60.4,61.2] },
  { ticker: 'BAJFINANCE',name: 'Bajaj Finance Ltd',   qty: 10,  avgCost: 6800,  ltp: 7124,  pnl: 3240,   pnlPercent: 4.76,   sparkline: [6800,6850,6920,6980,7050,7090,7124] },
]

const mockWatchlist: WatchlistItem[] = [
  { ticker: 'TCS',      name: 'Tata Consultancy',   price: 3842, change: 44.5,  changePercent: 1.17,  sparkline: [3780,3800,3815,3830,3820,3838,3842] },
  { ticker: 'WIPRO',    name: 'Wipro Ltd',           price: 512,  change: 8.2,   changePercent: 1.63,  sparkline: [498,500,503,506,508,510,512] },
  { ticker: 'TITAN',    name: 'Titan Company',       price: 3560, change: -22,   changePercent: -0.61, sparkline: [3590,3580,3572,3568,3562,3558,3560] },
  { ticker: 'ASIANPAINT',name:'Asian Paints',        price: 2610, change: -18.5, changePercent: -0.70, sparkline: [2640,2630,2620,2615,2610,2608,2610] },
]

const mockAlerts: PriceAlert[] = [
  { id: '1', ticker: 'HDFCBANK',   condition: 'Near 12-month target',        targetPrice: 1700,  currentPrice: 1628, status: 'NEAR' },
  { id: '2', ticker: 'INFY',       condition: 'Approaching key support',       targetPrice: 1600,  currentPrice: 1642, status: 'WATCH' },
  { id: '3', ticker: 'NIFTY 50',   condition: 'RSI overbought at 78.4',        targetPrice: 24500, currentPrice: 24280, status: 'RISK' },
]

const alertMeta: Record<string, { variant: 'amber' | 'blue' | 'red' }> = {
  NEAR: { variant: 'amber' }, WATCH: { variant: 'blue' }, RISK: { variant: 'red' },
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const w = 72, h = 32
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`sg-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? '#00e87a' : '#ff4d6a'} stopOpacity={0.25} />
          <stop offset="100%" stopColor={up ? '#00e87a' : '#ff4d6a'} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={up ? 'var(--green)' : 'var(--red)'} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function Market() {
  const totalValue = mockHoldings.reduce((s, h) => s + h.ltp * h.qty, 0)
  const totalPnl   = mockHoldings.reduce((s, h) => s + h.pnl, 0)
  const totalPnlPct = (totalPnl / (totalValue - totalPnl)) * 100
  const dayPnl = 4280

  return (
    <div className="flex flex-col gap-5">
      {/* Portfolio hero */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg3) 100%)', border: '1px solid var(--border2)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 85% 50%, rgba(0,232,122,0.06) 0%, transparent 60%)' }} />

        <div className="relative flex flex-wrap items-end gap-8">
          <div>
            <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1">Portfolio Value</p>
            <p className="font-syne font-extrabold text-[40px] text-[var(--text)] leading-none">
              ₹{(totalValue / 100000).toFixed(2)}L
            </p>
          </div>

          <div className="flex gap-6 mb-1">
            <div>
              <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-wider mb-1">Day P&L</p>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[var(--green)]" />
                <span className="font-mono text-[16px] font-medium text-[var(--green)]">+₹{dayPnl.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <div>
              <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-wider mb-1">Total Return</p>
              <div className="flex items-center gap-1.5">
                {totalPnlPct >= 0 ? <TrendingUp size={14} className="text-[var(--green)]" /> : <TrendingDown size={14} className="text-[var(--red)]" />}
                <span className={cn('font-mono text-[16px] font-medium', totalPnlPct >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')}>
                  {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
                </span>
              </div>
            </div>
            <div>
              <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-wider mb-1">Unrealized P&L</p>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[var(--green)]" />
                <span className="font-mono text-[16px] font-medium text-[var(--green)]">
                  +₹{totalPnl.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" icon={Plus}>Add Holding</Button>
            <Button variant="primary" size="sm">Import Portfolio</Button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        {/* Holdings table */}
        <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <p className="font-syne font-bold text-[15px] text-[var(--text)]">Holdings ({mockHoldings.length})</p>
            <button className="font-mono text-xs text-[var(--green)] hover:underline">Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Ticker', 'Company', 'Qty', 'Avg Cost', 'LTP', 'P&L', '7d Chart'].map(col => (
                    <th key={col} className="px-4 py-3 text-left font-mono text-2xs text-[var(--text3)] uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockHoldings.map((h) => (
                  <tr key={h.ticker} className="border-b border-[var(--border)] hover:bg-[var(--bg3)] transition-colors group cursor-pointer">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg4)] flex items-center justify-center">
                          <span className="font-syne font-bold text-[10px] text-[var(--text2)]">{h.ticker[0]}</span>
                        </div>
                        <span className="font-mono text-[14px] font-medium text-[var(--text)]">{h.ticker}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-dm text-[13px] text-[var(--text2)] whitespace-nowrap">{h.name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[14px] text-[var(--text)]">{h.qty}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[14px] text-[var(--text2)]">₹{h.avgCost.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[14px] font-medium text-[var(--text)]">₹{h.ltp.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className={cn('font-mono text-[14px] font-medium leading-tight', h.pnl >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')}>
                        {h.pnl >= 0 ? '+' : '−'}₹{Math.abs(h.pnl).toLocaleString('en-IN')}
                      </p>
                      <p className={cn('font-mono text-xs mt-0.5', h.pnl >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')} style={{ opacity: 0.75 }}>
                        {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Sparkline data={h.sparkline} up={h.pnl >= 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Watchlist */}
          <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <p className="font-syne font-bold text-[15px] text-[var(--text)]">Watchlist</p>
              <Button variant="ghost" size="sm" icon={Plus}>Add</Button>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {mockWatchlist.map((item) => (
                <div key={item.ticker} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg3)] transition-colors cursor-pointer">
                  <div>
                    <p className="font-mono text-[14px] font-medium text-[var(--text)]">{item.ticker}</p>
                    <p className="font-dm text-xs text-[var(--text3)]">{item.name}</p>
                  </div>
                  <Sparkline data={item.sparkline} up={item.change >= 0} />
                  <div className="ml-auto text-right">
                    <p className="font-mono text-[14px] font-medium text-[var(--text)]">₹{item.price.toLocaleString('en-IN')}</p>
                    <p className={cn('font-mono text-xs', item.change >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')}>
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Alerts */}
          <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <p className="font-syne font-bold text-[15px] text-[var(--text)]">Price Alerts</p>
              <Button variant="ghost" size="sm" icon={Bell}>Set Alert</Button>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {mockAlerts.map((alert) => {
                const distPct = Math.abs((alert.targetPrice - alert.currentPrice) / alert.currentPrice * 100)
                return (
                  <div key={alert.id} className="px-5 py-4 hover:bg-[var(--bg3)] transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[14px] font-medium text-[var(--text)]">{alert.ticker}</span>
                          <Badge variant={alertMeta[alert.status].variant} dot>{alert.status}</Badge>
                        </div>
                        <p className="font-dm text-xs text-[var(--text3)]">{alert.condition}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[14px] text-[var(--text)]">₹{alert.targetPrice.toLocaleString('en-IN')}</p>
                        <p className="font-mono text-xs text-[var(--text3)]">{distPct.toFixed(1)}% away</p>
                      </div>
                    </div>
                    <div className="h-1 bg-[var(--bg4)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, 100 - distPct * 5)}%`,
                          background: alert.status === 'RISK' ? 'var(--red)' : alert.status === 'NEAR' ? 'var(--amber)' : 'var(--blue)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Allocation donut mini */}
          <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card">
            <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-4">Sector Allocation</p>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Banking',    pct: 38, color: 'var(--green)' },
                { label: 'Technology', pct: 28, color: 'var(--blue)' },
                { label: 'Energy',     pct: 22, color: 'var(--amber)' },
                { label: 'Gold',       pct: 12, color: 'var(--text2)' },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-dm text-sm text-[var(--text2)] w-24">{label}</span>
                  <div className="flex-1 h-1.5 bg-[var(--bg4)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="font-mono text-xs text-[var(--text2)] w-8 text-right">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
