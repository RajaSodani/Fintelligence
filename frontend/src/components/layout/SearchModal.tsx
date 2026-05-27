import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, TrendingUp, Receipt } from 'lucide-react'
import { coreApi } from '@/lib/axios'

interface TxResult {
  id: string
  name: string
  amount: number
  category: string | null
  date: string
}

interface TickerResult {
  ticker: string
  companyName: string
  exchange: string
}

interface Props {
  onClose: () => void
}

export function SearchModal({ onClose }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [transactions, setTransactions] = useState<TxResult[]>([])
  const [tickers, setTickers] = useState<TickerResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setTransactions([]); setTickers([]); return }
    setLoading(true)
    try {
      const [txRes, tickerRes] = await Promise.allSettled([
        coreApi.get(`/api/v1/transactions?limit=5&name=${encodeURIComponent(q)}`),
        coreApi.get(`/api/v1/market/search?q=${encodeURIComponent(q)}`),
      ])
      if (txRes.status === 'fulfilled') setTransactions(txRes.value.data.transactions ?? [])
      if (tickerRes.status === 'fulfilled') setTickers((tickerRes.value.data ?? []).slice(0, 4))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  const isEmpty = !loading && !transactions.length && !tickers.length

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl shadow-card w-full overflow-hidden"
        style={{ maxWidth: 560 }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          <Search size={16} className="text-[var(--text3)] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, stocks…"
            className="flex-1 bg-transparent font-dm text-[15px] text-[var(--text)] placeholder:text-[var(--text3)] outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--text3)] hover:text-[var(--text)]">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {/* Tickers */}
          {tickers.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 font-mono text-2xs text-[var(--text3)] uppercase tracking-widest">Stocks</p>
              {tickers.map((t) => (
                <button
                  key={t.ticker}
                  onClick={() => { navigate(`/market`); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg3)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg4)] flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={13} className="text-[var(--green)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[13px] font-medium text-[var(--text)]">{t.ticker}</p>
                    <p className="font-dm text-xs text-[var(--text3)] truncate">{t.companyName}</p>
                  </div>
                  <span className="font-mono text-2xs text-[var(--text3)]">{t.exchange}</span>
                </button>
              ))}
            </div>
          )}

          {/* Transactions */}
          {transactions.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 font-mono text-2xs text-[var(--text3)] uppercase tracking-widest">Transactions</p>
              {transactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => { navigate('/dashboard'); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg3)] transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg4)] flex items-center justify-center flex-shrink-0">
                    <Receipt size={13} className="text-[var(--text2)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dm text-[13px] font-medium text-[var(--text)] truncate">{tx.name}</p>
                    <p className="font-mono text-xs text-[var(--text3)]">{tx.category ?? 'Other'}</p>
                  </div>
                  <p className={`font-mono text-[13px] font-medium flex-shrink-0 ${tx.amount < 0 ? 'text-[var(--green)]' : 'text-[var(--text)]'}`}>
                    {tx.amount < 0 ? '+' : '−'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                  </p>
                </button>
              ))}
            </div>
          )}

          {isEmpty && query.trim() && (
            <div className="flex items-center justify-center py-10">
              <p className="font-mono text-xs text-[var(--text3)]">No results for "{query}"</p>
            </div>
          )}

          {!query.trim() && (
            <div className="flex items-center justify-center py-8">
              <p className="font-mono text-xs text-[var(--text3)]">Type to search transactions or stocks</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="w-4 h-4 rounded-full border-2 border-[var(--green)] border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
