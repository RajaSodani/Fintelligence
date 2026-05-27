import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useUser } from '@/hooks/useUser'
import { useMarketHours } from '@/hooks/useMarketHours'
import { NotificationPanel } from './NotificationPanel'
import { SearchModal } from './SearchModal'

const pageMeta: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'Dashboard',         sub: 'Overview of your finances' },
  '/research':  { title: 'AI Research',        sub: 'Multi-agent stock analysis' },
  '/market':    { title: 'Market & Portfolio', sub: 'Live holdings & watchlist' },
  '/settings':  { title: 'Settings',           sub: 'Account & preferences' },
}

export function TopBar() {
  const location = useLocation()
  const { user } = useUser()
  const { isMarketOpen } = useMarketHours()
  const meta = pageMeta[location.pathname] ?? { title: 'Fintelligence', sub: '' }
  const [searchOpen, setSearchOpen] = useState(false)

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      <header
        className="fixed top-0 right-0 z-30 flex items-center justify-between px-6"
        style={{
          left: 240,
          height: 64,
          background: 'rgba(7,9,15,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border2)',
        }}
      >
        {/* Page title */}
        <div>
          <h1 className="font-syne font-bold text-[17px] text-[var(--text)] leading-tight tracking-tight">
            {meta.title}
          </h1>
          <p className="font-mono text-2xs text-[var(--text3)] tracking-wider">{meta.sub}</p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text3)] hover:text-[var(--text2)] hover:bg-[var(--bg3)] transition-all border border-[var(--border)]"
          >
            <Search size={14} />
            <span className="font-mono text-xs tracking-wider">Search…</span>
            <kbd className="font-mono text-2xs bg-[var(--bg4)] border border-[var(--border2)] px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>

        {/* Live indicator — only during market hours */}
        {isMarketOpen && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{ borderColor: 'rgba(0,232,122,0.15)', background: 'rgba(0,232,122,0.05)' }}
          >
            <span
              className="pulse-dot w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: 'var(--green)' }}
            />
            <span
              className="font-mono text-2xs tracking-[0.1em] uppercase hidden sm:block"
              style={{ color: 'var(--green)' }}
            >
              Live
            </span>
          </div>
        )}

        {/* Notification bell */}
        <NotificationPanel />

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-syne font-extrabold text-[12px] flex-shrink-0 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, var(--green), var(--blue))', color: '#07090f' }}
        >
          {initials}
        </div>
      </div>
    </header>
    </>
  )
}
