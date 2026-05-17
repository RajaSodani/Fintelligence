import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useOHLC } from '@/hooks/useMarketData'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'

const RANGES = ['1W', '1M', '3M', '6M', '1Y'] as const
type Range = typeof RANGES[number]

const RANGE_PARAM: Record<Range, string> = { '1W': '1w', '1M': '1m', '3M': '3m', '6M': '6m', '1Y': '1y' }

interface OHLCTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

function OHLCTooltip({ active, payload, label }: OHLCTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg3)] border border-[var(--border2)] rounded-xl px-3 py-2 shadow-card">
      <p className="font-mono text-2xs text-[var(--text3)] mb-0.5">{label}</p>
      <p className="font-mono text-[15px] text-[var(--text)]">₹{payload[0].value.toLocaleString('en-IN')}</p>
    </div>
  )
}

interface OHLCChartProps {
  ticker: string
}

export function OHLCChart({ ticker }: OHLCChartProps) {
  const [range, setRange] = useState<Range>('1M')
  const { data, loading } = useOHLC(ticker, RANGE_PARAM[range])

  const isUp = data.length >= 2 ? data[data.length - 1].close >= data[0].close : true
  const color = isUp ? 'var(--green)' : 'var(--red)'
  const gradId = `ohlc-grad-${ticker.replace(/[^a-z0-9]/gi, '')}`

  const chartData = data.map((d) => ({ date: d.date, close: d.close }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest">{ticker} · Price History</p>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-2.5 py-1 rounded-lg font-mono text-2xs transition-all',
                range === r
                  ? 'bg-[var(--green)] text-[#07090f] font-bold'
                  : 'text-[var(--text3)] hover:text-[var(--text2)] hover:bg-[var(--bg4)]',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height: 180 }}>
          <LoadingSpinner />
        </div>
      ) : (
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text3)', fontSize: 10, fontFamily: 'DM Mono' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip content={<OHLCTooltip />} cursor={{ stroke: 'var(--border2)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: 'var(--bg)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
