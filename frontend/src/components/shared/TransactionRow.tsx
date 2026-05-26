import { useState, useRef, useEffect } from 'react'
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

const ALL_CATEGORIES = ['Food & Dining', 'Shopping', 'Transport', 'Subscriptions', 'Utilities', 'Housing & Finance', 'Health', 'Income', 'Other']

interface Props {
  tx: Transaction
  showYear?: boolean
  onCategoryChange?: (txId: string, newCategory: string) => void
}

export function TransactionRow({ tx, showYear = false, onCategoryChange }: Props) {
  const isCredit = tx.amount < 0
  const displayAmount = Math.abs(tx.amount)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

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
        <div className="flex items-center gap-1.5">
          {onCategoryChange ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="font-mono text-xs text-[var(--text3)] hover:text-[var(--green)] transition-colors"
              >
                {tx.category ?? 'Other'} ▾
              </button>
              {open && (
                <div className="absolute left-0 top-full mt-1 z-10 bg-[var(--bg3)] border border-[var(--border2)] rounded-xl shadow-card py-1 w-44">
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className="w-full text-left px-3 py-1.5 font-dm text-xs text-[var(--text2)] hover:bg-[var(--bg4)] transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        onCategoryChange(tx.id, cat)
                        setOpen(false)
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="font-mono text-xs text-[var(--text3)]">{tx.category ?? 'Other'}</span>
          )}
          <span className="font-mono text-xs text-[var(--text3)]">·</span>
          <span className="font-mono text-xs text-[var(--text3)]">
            {new Date(tx.date).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', ...(showYear ? { year: 'numeric' } : {}),
            })}
          </span>
        </div>
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
