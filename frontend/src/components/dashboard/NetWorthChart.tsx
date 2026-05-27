import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { formatCompact } from '@/lib/utils'

interface TrendPoint {
  month: string
  value: number
}

interface Props {
  trendData: TrendPoint[]
  totalNetWorth: number
  loading: boolean
}

const EMPTY_TREND: TrendPoint[] = [
  { month: 'Nov', value: 0 }, { month: 'Dec', value: 0 }, { month: 'Jan', value: 0 },
  { month: 'Feb', value: 0 }, { month: 'Mar', value: 0 }, { month: 'Apr', value: 0 },
  { month: 'May', value: 0 },
]

function Tooltip_({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg3)] border border-[var(--border2)] rounded-xl px-3 py-2 shadow-card">
      <p className="font-mono text-2xs text-[var(--text3)] mb-0.5">{label}</p>
      <p className="num text-[15px] text-[var(--text)]">{formatCompact(payload[0].value)}</p>
    </div>
  )
}

export function NetWorthChart({ trendData, totalNetWorth, loading }: Props) {
  const data = trendData.length > 0 ? trendData : EMPTY_TREND
  const first = data[0]?.value ?? 0
  const last  = data[data.length - 1]?.value ?? 0
  const delta = last - first
  const pct   = first !== 0 ? ((delta / Math.abs(first)) * 100).toFixed(1) : null

  return (
    <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card flex flex-col h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1">Net Worth Trend</p>
          <p className="num text-[28px] text-[var(--text)]">{loading ? '...' : formatCompact(totalNetWorth)}</p>
          {delta !== 0 ? (
            <div className="flex items-center gap-1.5 mt-1.5">
              <ArrowUpRight size={13} className={delta >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'} />
              <span className={`font-mono text-xs ${delta >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {delta >= 0 ? '+' : ''}{formatCompact(delta)} over 6 months
                {pct ? ` (${delta >= 0 ? '+' : ''}${pct}%)` : ''}
              </span>
            </div>
          ) : (
            <p className="font-mono text-xs text-[var(--text3)] mt-1.5">Connect a bank to see trend</p>
          )}
        </div>
        {pct && (
          <Badge variant={parseFloat(pct) >= 0 ? 'green' : 'red'} dot>
            {parseFloat(pct) >= 0 ? '+' : ''}{pct}% 6mo
          </Badge>
        )}
      </div>

      <div className="flex-1" style={{ minHeight: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00e87a" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#00e87a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--text3)', fontSize: 11, fontFamily: 'DM Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<Tooltip_ />} cursor={{ stroke: 'var(--border2)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#00e87a"
              strokeWidth={2.5}
              fill="url(#nwGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#00e87a', stroke: 'var(--bg)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
