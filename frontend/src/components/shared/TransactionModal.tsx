import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Search } from 'lucide-react'
import { coreApi } from '@/lib/axios'
import { Transaction } from '@/hooks/useTransactions'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { TransactionRow } from '@/components/shared/TransactionRow'

const PAGE_SIZE = 25

interface Props {
  onClose: () => void
}

export function TransactionModal({ onClose }: Props) {
  const [items, setItems] = useState<Transaction[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasMore = total === null || items.length < total

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const loadPage = useCallback(async (pageOffset: number, nameFilter: string) => {
    if (loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(pageOffset) })
      if (nameFilter) params.set('name', nameFilter)
      const { data } = await coreApi.get(`/api/v1/transactions?${params}`)
      setTotal(data.total)
      setItems((prev) => pageOffset === 0 ? data.transactions : [...prev, ...data.transactions])
      setOffset(pageOffset + data.transactions.length)
    } finally {
      setLoading(false)
    }
  }, [loading])

  // Reset + reload when search changes
  useEffect(() => {
    setItems([])
    setTotal(null)
    setOffset(0)
    loadPage(0, debouncedSearch)
  }, [debouncedSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadPage(offset, debouncedSearch)
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, offset, debouncedSearch, loadPage])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleCategoryChange = async (txId: string, category: string) => {
    try {
      await coreApi.patch(`/api/v1/transactions/${txId}/category`, { category })
      setItems((prev) => prev.map((tx) => tx.id === txId ? { ...tx, category } : tx))
    } catch {
      // silently fail
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl shadow-card flex flex-col"
        style={{ width: '100%', maxWidth: 640, maxHeight: '85vh' }}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border)] flex-shrink-0">
          <div>
            <p className="font-syne font-bold text-[15px] text-[var(--text)]">All Transactions</p>
            {total !== null && (
              <p className="font-mono text-2xs text-[var(--text3)] mt-0.5">{total} total</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border2)] rounded-xl px-3 py-2 focus-within:border-[rgba(0,232,122,0.35)] transition-colors">
            <Search size={14} className="text-[var(--text3)] flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="flex-1 bg-transparent font-dm text-[14px] text-[var(--text)] placeholder:text-[var(--text3)] outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[var(--text3)] hover:text-[var(--text)]">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-[var(--border)]">
          {items.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              showYear
              onCategoryChange={handleCategoryChange}
            />
          ))}

          {!loading && items.length === 0 && total === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="font-mono text-xs text-[var(--text3)]">No transactions found</p>
            </div>
          )}

          <div ref={sentinelRef} className="py-4 flex items-center justify-center">
            {loading && <LoadingSpinner />}
            {!loading && !hasMore && items.length > 0 && (
              <p className="font-mono text-xs text-[var(--text3)]">All transactions loaded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
