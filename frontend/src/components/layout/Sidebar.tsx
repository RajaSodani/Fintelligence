import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Search, BarChart2, Settings, LogOut, Sparkles } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/research',  icon: Search,          label: 'Research' },
  { to: '/market',    icon: BarChart2,        label: 'Market' },
  { to: '/settings',  icon: Settings,         label: 'Settings' },
]

export function Sidebar() {
  const { signOut } = useClerk()
  const { user } = useUser()

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email : 'Loading…'

  return (
    <aside
      className="fixed top-0 left-0 h-full w-[240px] flex flex-col z-40"
      style={{
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border2)',
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00e87a, #00c968)', boxShadow: '0 0 16px rgba(0,232,122,0.4)' }}
          >
            <Sparkles size={14} color="#07090f" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-syne font-extrabold text-[15px] text-[var(--text)] tracking-tight block leading-none">
              Fintelligence
            </span>
            <span className="font-mono text-2xs text-[var(--text3)] tracking-wider">BETA</span>
          </div>
        </div>
      </div>

      <div className="px-3 mb-2">
        <div className="h-px bg-[var(--border)]" />
      </div>

      {/* Nav label */}
      <p className="px-6 mb-1 font-mono text-2xs text-[var(--text3)] tracking-[0.12em] uppercase">Menu</p>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                isActive
                  ? 'bg-[rgba(0,232,122,0.1)] text-[var(--green)] font-semibold'
                  : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                    isActive
                      ? 'bg-[rgba(0,232,122,0.15)]'
                      : 'bg-[var(--bg4)] group-hover:bg-[var(--bg5)]'
                  )}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? 'text-[var(--green)]' : ''}
                  />
                </div>
                <span className="font-dm font-medium">{label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* AI Badge */}
      <div className="px-4 mb-3">
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(0,232,122,0.06), rgba(77,159,255,0.06))', border: '1px solid rgba(0,232,122,0.12)' }}
        >
          <div className="flex-1">
            <p className="font-syne font-bold text-xs text-[var(--text)]">Free Plan</p>
            <p className="font-mono text-2xs text-[var(--text3)]">5 reports left</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[rgba(0,232,122,0.1)] flex items-center justify-center">
            <Sparkles size={14} className="text-[var(--green)]" />
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="px-3 pb-4">
        <div className="h-px bg-[var(--border)] mb-3" />
        <div className="flex items-center gap-3 px-2 py-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-syne font-extrabold text-[13px]"
            style={{ background: 'linear-gradient(135deg, var(--green), var(--blue))', color: '#07090f' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-dm text-sm font-medium text-[var(--text)] truncate leading-tight">{displayName}</p>
            <p className="font-mono text-2xs text-[var(--text3)] truncate">{user?.email ?? ''}</p>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[var(--red)] hover:bg-[rgba(255,77,106,0.08)] transition-all"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
