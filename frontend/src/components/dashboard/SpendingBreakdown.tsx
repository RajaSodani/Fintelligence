import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SpendingDonut } from '@/components/charts/SpendingDonut'

interface DonutEntry {
  category: string
  amount: number
  color: string
}

interface Props {
  data: DonutEntry[]
  loading: boolean
}

export function SpendingBreakdown({ data, loading }: Props) {
  return (
    <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card">
      <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-4">Spending Breakdown</p>
      {loading ? (
        <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
      ) : data.length === 0 ? (
        <EmptyState title="No spending data yet" description="Connect your bank to see a breakdown" />
      ) : (
        <SpendingDonut data={data} />
      )}
    </div>
  )
}
