import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DonutSlice {
  category: string
  amount: number
  color: string
}

interface Props {
  data: DonutSlice[]
}

const RADIAN = Math.PI / 180

function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`
}

interface LabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function SpendingDonut({ data }: Props) {
  const total = data.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="flex items-center gap-6">
      <div className="w-[180px] h-[180px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="amount"
              nameKey="category"
              labelLine={false}
              label={CustomLabel}
              isAnimationActive
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry) => (
                <Cell key={entry.category} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatINR(value), 'Spend']}
              contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: 'var(--text1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {data.map((item) => (
          <div key={item.category} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-xs text-[var(--text2)] truncate">{item.category}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[var(--text1)] font-medium">{formatINR(item.amount)}</span>
              <span className="text-[10px] text-[var(--text3)]">
                {total > 0 ? `${((item.amount / total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
