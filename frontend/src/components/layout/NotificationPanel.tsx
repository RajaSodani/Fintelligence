import { useState, useEffect, useRef } from 'react'
import { Bell, Bell as BellFill, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import { cn } from '@/lib/utils'

const SEEN_KEY = 'finmind:seen-notifications'

function getSeenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')) }
  catch { return new Set() }
}

function markAllSeen(ids: string[]) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(ids))
}

interface SyncNotif {
  id: string
  type: 'sync'
  text: string
  ts: number
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(getSeenIds)
  const [syncNotifs, setSyncNotifs] = useState<SyncNotif[]>([])
  const panelRef = useRef<HTMLDivElement>(null)
  const { alerts } = useAlerts()

  const triggeredAlerts = alerts.filter((a) => a.isTriggered)

  // Listen for sync events
  useEffect(() => {
    const handler = () => {
      const id = `sync-${Date.now()}`
      setSyncNotifs((prev) => [{ id, type: 'sync', text: 'Bank data synced successfully', ts: Date.now() }, ...prev].slice(0, 5))
    }
    window.addEventListener('finmind:sync', handler)
    return () => window.removeEventListener('finmind:sync', handler)
  }, [])

  const allNotifIds = [
    ...triggeredAlerts.map((a) => a.id),
    ...syncNotifs.map((n) => n.id),
  ]
  const unreadCount = allNotifIds.filter((id) => !seen.has(id)).length

  const handleOpen = () => {
    setOpen((v) => !v)
  }

  const handleClear = () => {
    markAllSeen(allNotifIds)
    setSeen(new Set(allNotifIds))
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-all border border-[var(--border)]"
      >
        {unreadCount > 0 ? <BellFill size={16} className="text-[var(--text2)]" /> : <Bell size={16} />}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--green)] border-2 border-[var(--bg)]" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl shadow-card overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <p className="font-syne font-bold text-[14px] text-[var(--text)]">Notifications</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleClear}
                  className="font-mono text-2xs text-[var(--green)] hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-[var(--text3)] hover:text-[var(--text)]">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {syncNotifs.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] transition-colors',
                  !seen.has(n.id) ? 'bg-[rgba(0,232,122,0.03)]' : ''
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-[rgba(0,232,122,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RefreshCw size={12} className="text-[var(--green)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-dm text-[13px] text-[var(--text)]">{n.text}</p>
                  <p className="font-mono text-2xs text-[var(--text3)] mt-0.5">
                    {new Date(n.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!seen.has(n.id) && <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] flex-shrink-0 mt-1.5" />}
              </div>
            ))}

            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] transition-colors',
                  !seen.has(alert.id) ? 'bg-[rgba(0,232,122,0.03)]' : ''
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-[rgba(0,232,122,0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {alert.condition === 'ABOVE'
                    ? <TrendingUp size={12} className="text-[var(--green)]" />
                    : <TrendingDown size={12} className="text-[var(--amber)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-dm text-[13px] text-[var(--text)]">
                    <span className="font-semibold">{alert.ticker}</span> alert triggered
                  </p>
                  <p className="font-mono text-2xs text-[var(--text3)] mt-0.5">
                    {alert.condition === 'ABOVE' ? 'Rose above' : 'Fell below'} ₹{alert.targetPrice.toLocaleString('en-IN')}
                  </p>
                </div>
                {!seen.has(alert.id) && <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] flex-shrink-0 mt-1.5" />}
              </div>
            ))}

            {allNotifIds.length === 0 && (
              <div className="flex items-center justify-center py-10">
                <div className="text-center">
                  <Bell size={24} className="text-[var(--text3)] mx-auto mb-2" />
                  <p className="font-mono text-xs text-[var(--text3)]">No notifications yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
