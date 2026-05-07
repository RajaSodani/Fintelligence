import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
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
