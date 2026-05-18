import { Transaction } from '@/hooks/useTransactions'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining':     'var(--green)',
  'Shopping':          'var(--blue)',
  'Transport':         'var(--amber)',
  'Subscriptions':     'var(--red)',
  'Income':            'var(--purple)',
  'Utilities':         'var(--text2)',
  'Housing & Finance': 'var(--gold)',
  'Health':            '#0ea5e9',
  'Other':             'var(--text3)',
}

interface Props {
  tx: Transaction
  showYear?: boolean
}

export function TransactionRow({ tx, showYear = false }: Props) {
  const isCredit = tx.amount < 0
  const displayAmount = Math.abs(tx.amount)
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg3)] transition-colors">
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
          {tx.category ?? 'Other'} · {new Date(tx.date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', ...(showYear ? { year: 'numeric' } : {}),
          })}
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
}
