import { useState, useEffect, useRef } from 'react'
import { coreApi } from '@/lib/axios'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface SearchResult {
  ticker: string
  companyName: string
  exchange: string
}

interface TickerSearchProps {
  value: string
  onSelect: (ticker: string, companyName: string) => void
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}

export function TickerSearch({ value, onSelect, onChange, placeholder = 'Search ticker…', className = '' }: TickerSearchProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await coreApi.get<SearchResult[]>(`/api/v1/market/search?q=${encodeURIComponent(query)}`)
        setResults(data)
        setOpen(data.length > 0)
      } catch {
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (r: SearchResult) => {
    setQuery(r.ticker)
    setOpen(false)
    onSelect(r.ticker, r.companyName)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => { const v = e.target.value.toUpperCase(); setQuery(v); onChange?.(v) }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 font-dm text-[15px] text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[rgba(0,232,122,0.35)] outline-none transition-colors ${className}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[var(--bg3)] border border-[var(--border2)] rounded-xl shadow-card overflow-hidden">
          {results.map((r) => (
            <button
              key={r.ticker}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg4)] text-left transition-colors"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(r) }}
            >
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[13px] font-medium text-[var(--text)]">{r.ticker}</span>
                <span className="font-dm text-xs text-[var(--text3)] ml-2 truncate">{r.companyName}</span>
              </div>
              <span className="font-mono text-2xs text-[var(--text3)] flex-shrink-0">{r.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
