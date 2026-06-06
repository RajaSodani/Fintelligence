import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { coreApi } from '@/lib/axios'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useInactivityLogout } from '@/hooks/useInactivityLogout'

// ── Clerk version (preserved for future switch-back) ──────────────────────
// import { useAuth } from '@clerk/clerk-react'
// const { isSignedIn } = useAuth()
// ──────────────────────────────────────────────────────────────────────────

function InactivityWarning({ secondsLeft, onExtend }: { secondsLeft: number; onExtend: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(7,9,15,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl p-8 max-w-sm w-full text-center shadow-card">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)' }}
        >
          <span className="font-mono font-bold text-[22px] text-[var(--amber)]">{secondsLeft}</span>
        </div>
        <h2 className="font-syne font-bold text-[18px] text-[var(--text)] mb-2">Session Expiring</h2>
        <p className="font-dm text-[14px] text-[var(--text2)] mb-6">
          You've been inactive. For your security, you'll be signed out in {secondsLeft} seconds.
        </p>
        <button
          onClick={onExtend}
          className="w-full py-3 rounded-xl font-syne font-semibold text-sm transition-all"
          style={{ background: 'var(--green)', color: '#07090f' }}
        >
          Keep me signed in
        </button>
      </div>
    </div>
  )
}

export function AppLayout() {
  const { isSignedIn } = useAuthContext()
  const { showWarning, secondsLeft, extendSession } = useInactivityLogout()

  useEffect(() => {
    if (isSignedIn) {
      coreApi.get('/api/v1/users/me').catch(() => {})
    }
  }, [isSignedIn])

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <TopBar />
      <main
        className="min-h-screen overflow-y-auto"
        style={{ marginLeft: 240, paddingTop: 64 }}
      >
        <div className="p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>

      {showWarning && (
        <InactivityWarning secondsLeft={secondsLeft} onExtend={extendSession} />
      )}
    </div>
  )
}
