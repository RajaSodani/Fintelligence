import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { coreApi } from '@/lib/axios'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  const { isSignedIn } = useAuth()

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
    </div>
  )
}
