import { useState } from 'react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { TransactionModal } from '@/components/shared/TransactionModal'
import { TransactionRow } from '@/components/shared/TransactionRow'
import type { Transaction } from '@/hooks/useTransactions'

interface Props {
  transactions: Transaction[]
  loading: boolean
}

export function RecentTransactions({ transactions, loading }: Props) {
  const [showAll, setShowAll] = useState(false)

  return (
    <>
      {showAll && <TransactionModal onClose={() => setShowAll(false)} />}

      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border)]">
          <p className="font-syne font-bold text-[15px] text-[var(--text)]">Recent Transactions</p>
          <button
            className="font-mono text-xs text-[var(--green)] hover:underline"
            onClick={() => setShowAll(true)}
          >
            View all
          </button>
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
