import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { SpendingDonut } from '@/components/charts/SpendingDonut'
import { BudgetModal } from '@/components/dashboard/BudgetModal'
import { useBudget } from '@/hooks/useBudget'
import { CATEGORY_COLORS } from '@/components/shared/TransactionRow'
import type { CategoryTotal } from '@/hooks/useTransactionSummary'

const NEED_CATS = new Set(['Utilities', 'Housing & Finance', 'Health'])

interface Props {
  categories: CategoryTotal[]
  loading: boolean
}

export function SpendingBreakdown({ categories, loading }: Props) {
  const [showBudget, setShowBudget] = useState(false)
  const { budgets } = useBudget()

  const spending = categories.filter((c) => c.category !== 'Income')

  const donutData = spending
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .map((c) => ({ category: c.category, amount: c.total, color: CATEGORY_COLORS[c.category] ?? 'var(--text3)' }))

  const needs = spending.filter((c) => NEED_CATS.has(c.category)).reduce((s, c) => s + c.total, 0)
  const wants = spending.filter((c) => !NEED_CATS.has(c.category)).reduce((s, c) => s + c.total, 0)
  const nwTotal = needs + wants

  const formatINR = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

  return (
    <>
      {showBudget && <BudgetModal onClose={() => setShowBudget(false)} />}

      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest">Spending Breakdown</p>
          <button
            onClick={() => setShowBudget(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors"
            title="Set monthly budget"
          >
            <Settings2 size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
        ) : spending.length === 0 ? (
          <EmptyState title="No spending data yet" description="Connect your bank to see a breakdown" />
        ) : (
          <div className="flex flex-col gap-4">
            <SpendingDonut data={donutData} />

            {/* Budget progress bars */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
              <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1">vs Budget</p>
              {spending.slice(0, 4).map((cat) => {
                const budget = budgets[cat.category] ?? 0
                const pct = budget > 0 ? Math.min((cat.total / budget) * 100, 100) : 0
                const over = budget > 0 && cat.total > budget
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-dm text-xs text-[var(--text2)]">{cat.category}</span>
                      <span className={`font-mono text-xs ${over ? 'text-[var(--red)]' : 'text-[var(--text3)]'}`}>
                        {formatINR(cat.total)}{budget > 0 ? ` / ${formatINR(budget)}` : ''}
                      </span>
                    </div>
                    {budget > 0 && (
                      <div className="h-1.5 rounded-full bg-[var(--bg4)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: over ? 'var(--red)' : (CATEGORY_COLORS[cat.category] ?? 'var(--green)'),
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Need vs Want */}
            {nwTotal > 0 && (
              <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
                <div className="flex-1 rounded-xl bg-[var(--bg3)] p-3">
                  <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1">Needs</p>
                  <p className="font-mono text-[14px] text-[var(--text)]">{formatINR(needs)}</p>
                  <p className="font-mono text-2xs text-[var(--text3)] mt-0.5">
                    {nwTotal > 0 ? `${Math.round((needs / nwTotal) * 100)}%` : '0%'}
                  </p>
                </div>
                <div className="flex-1 rounded-xl bg-[var(--bg3)] p-3">
                  <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1">Wants</p>
                  <p className="font-mono text-[14px] text-[var(--text)]">{formatINR(wants)}</p>
                  <p className="font-mono text-2xs text-[var(--text3)] mt-0.5">
                    {nwTotal > 0 ? `${Math.round((wants / nwTotal) * 100)}%` : '0%'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
