import { useState } from 'react'
import { Plus } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { TransactionModal } from '@/components/shared/TransactionModal'
import { TransactionRow } from '@/components/shared/TransactionRow'
import { CashEntryModal } from '@/components/dashboard/CashEntryModal'
import type { Transaction } from '@/hooks/useTransactions'

interface Props {
  transactions: Transaction[]
  loading: boolean
}

export function RecentTransactions({ transactions, loading }: Props) {
  const [showAll, setShowAll] = useState(false)
  const [showCash, setShowCash] = useState(false)

  return (
    <>
      {showAll && <TransactionModal onClose={() => setShowAll(false)} />}
      {showCash && <CashEntryModal onClose={() => setShowCash(false)} onSuccess={() => {}} />}

      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border)]">
          <p className="font-syne font-bold text-[15px] text-[var(--text)]">Recent Transactions</p>
          <div className="flex items-center gap-3">
            <button
              className="w-7 h-7 rounded-lg bg-[var(--bg3)] border border-[var(--border2)] flex items-center justify-center text-[var(--text3)] hover:text-[var(--green)] hover:border-[rgba(0,232,122,0.3)] transition-colors"
              onClick={() => setShowCash(true)}
              title="Add cash entry"
            >
              <Plus size={13} />
            </button>
            <button
              className="font-mono text-xs text-[var(--green)] hover:underline"
              onClick={() => setShowAll(true)}
            >
              View all
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Connect your bank account to see transactions"
          />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>
    </>
  )
}
