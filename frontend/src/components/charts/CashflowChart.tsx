import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

interface DataPoint {
  month: string
  income?: number
  expenses?: number
  incomeF?: number
  expensesF?: number
}

interface Props {
  data: Array<{ month: string; income: number; expenses: number; predicted?: boolean }>
}

function formatINR(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`
  return `₹${value}`
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

const KEY_LABELS: Record<string, string> = {
  income: 'Income', expenses: 'Expenses',
  incomeF: 'Income (forecast)', expensesF: 'Expenses (forecast)',
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text2)', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {KEY_LABELS[p.name] ?? p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  )
}

export function CashflowChart({ data }: Props) {
  const firstForecast = data.findIndex((d) => d.predicted)

  // Split into two keys: actual vs forecast
  const chartData: DataPoint[] = data.map((d) => ({
    month: d.month,
    ...(d.predicted ? { incomeF: d.income, expensesF: d.expenses } : { income: d.income, expenses: d.expenses }),
  }))

  // Bridge gap: last actual point gets both actual + forecast values
  if (firstForecast > 0) {
    const bridgeIdx = firstForecast - 1
    chartData[bridgeIdx] = {
      ...chartData[bridgeIdx],
      incomeF: data[bridgeIdx].income,
      expensesF: data[bridgeIdx].expenses,
    }
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--green)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--red)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatINR} tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: 'var(--text2)', paddingTop: 8 }}
          formatter={(value: string) => KEY_LABELS[value] ?? value}
        />

        {firstForecast >= 0 && (
          <ReferenceLine
            x={data[firstForecast].month}
            stroke="var(--text3)"
            strokeDasharray="4 4"
            label={{ value: 'Forecast', position: 'insideTopRight', fill: 'var(--text3)', fontSize: 10 }}
          />
        )}

        {/* Actuals */}
        <Area type="monotone" dataKey="income" stroke="var(--green)" strokeWidth={2}
          fill="url(#incomeGrad)" dot={false} activeDot={{ r: 4 }} isAnimationActive animationDuration={800} />
        <Area type="monotone" dataKey="expenses" stroke="var(--red)" strokeWidth={2}
          fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4 }} isAnimationActive animationDuration={800} />

        {/* Forecast (dashed) */}
        <Area type="monotone" dataKey="incomeF" stroke="var(--green)" strokeWidth={2}
          strokeDasharray="5 3" fill="none" dot={false} activeDot={{ r: 4 }}
          isAnimationActive animationDuration={800} legendType="none" />
        <Area type="monotone" dataKey="expensesF" stroke="var(--red)" strokeWidth={2}
          strokeDasharray="5 3" fill="none" dot={false} activeDot={{ r: 4 }}
          isAnimationActive animationDuration={800} legendType="none" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
