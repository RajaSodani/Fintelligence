import { Building2, Crown, LogOut, Shield, Bell, Globe, ChevronRight, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import { useState } from 'react'
import { PlaidConnect } from '@/components/PlaidConnect'
import { UpgradeModal } from '@/components/UpgradeModal'

const connectedBanks = [
  { name: 'HDFC Bank',     type: 'Savings + Salary',    connected: true,  balance: '₹2,14,320' },
  { name: 'Zerodha Kite',  type: 'Equity Brokerage',    connected: true,  balance: '₹4,32,840' },
]

const planFeatures = {
  free: [
    '5 AI research reports / month',
    '1 connected bank account',
    'Basic portfolio tracking',
    'Live market data (15-min delay)',
  ],
  pro: [
    'Unlimited AI research reports',
    'Unlimited bank connections',
    'Advanced portfolio analytics',
    'Real-time market data',
    'AI financial advisor chat',
    'Tax optimization insights',
    'Priority support',
  ],
}

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card">
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--bg4)] flex items-center justify-center">
          <Icon size={15} className="text-[var(--text2)]" />
        </div>
        <h2 className="font-syne font-bold text-[15px] text-[var(--text)]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export function Settings() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [notifications, setNotifications] = useState({ priceAlerts: true, aiInsights: true, weeklyReport: false })
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  const toggle = (key: keyof typeof notifications) =>
    setNotifications(n => ({ ...n, [key]: !n[key] }))

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Profile */}
      <Section title="Profile" icon={Globe}>
        <div className="flex items-center gap-5 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-syne font-extrabold text-[22px] flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--green), var(--blue))', color: '#07090f' }}
          >
            {initials}
          </div>
          <div>
            <p className="font-syne font-bold text-[20px] text-[var(--text)] leading-tight">
              {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'User' : '—'}
            </p>
            <p className="font-mono text-sm text-[var(--text2)] mt-0.5">{user?.email ?? '—'}</p>
            <Badge variant="green" dot className="mt-2">Active</Badge>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto">Edit Profile</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'First Name', value: user?.firstName || '—' },
            { label: 'Last Name',  value: user?.lastName  || '—' },
            { label: 'Email',      value: user?.email     || '—' },
            { label: 'Member Since', value: 'May 2025' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-mono text-2xs text-[var(--text3)] uppercase tracking-widest mb-1.5">{label}</p>
              <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 font-dm text-[15px] text-[var(--text)]">
                {value}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Connected Accounts */}
      <Section title="Connected Accounts" icon={Building2}>
        <div className="flex flex-col gap-3 mb-4">
          {connectedBanks.map((bank) => (
            <div
              key={bank.name}
              className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border)]"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--bg4)] flex items-center justify-center flex-shrink-0">
                <Building2 size={16} className="text-[var(--text2)]" />
              </div>
              <div className="flex-1">
                <p className="font-dm text-[15px] font-medium text-[var(--text)]">{bank.name}</p>
                <p className="font-mono text-xs text-[var(--text3)]">{bank.type}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[14px] text-[var(--text)]">{bank.balance}</p>
                <Badge variant="green" dot className="mt-1">Connected</Badge>
              </div>
              <ChevronRight size={16} className="text-[var(--text3)]" />
            </div>
          ))}

          <div className="p-4 rounded-xl border border-dashed border-[var(--border2)]">
            <p className="font-mono text-xs text-[var(--text3)] mb-3">Plaid · 10,000+ institutions</p>
            <PlaidConnect />
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {[
            { key: 'priceAlerts',  label: 'Price Alerts',    desc: 'Get notified when your alerts trigger' },
            { key: 'aiInsights',   label: 'AI Insights',     desc: 'Daily AI-generated portfolio insights' },
            { key: 'weeklyReport', label: 'Weekly Report',   desc: 'Portfolio performance summary every Sunday' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div>
                <p className="font-dm text-[15px] font-medium text-[var(--text)]">{label}</p>
                <p className="font-mono text-xs text-[var(--text3)]">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key as keyof typeof notifications)}
                className={cn(
                  'w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0',
                  notifications[key as keyof typeof notifications]
                    ? 'bg-[var(--green)]'
                    : 'bg-[var(--bg4)] border border-[var(--border2)]'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ml-1',
                    notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Subscription */}
      <Section title="Subscription" icon={Crown}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free */}
          <div className="p-5 rounded-xl bg-[var(--bg3)] border border-[var(--border2)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-syne font-bold text-[16px] text-[var(--text)]">Free</p>
              <Badge variant="muted">Current</Badge>
            </div>
            <p className="font-syne font-extrabold text-[28px] text-[var(--text)] leading-none">₹0<span className="text-[var(--text3)] text-sm font-dm font-normal">/mo</span></p>
            <div className="flex flex-col gap-2">
              {planFeatures.free.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={13} className="text-[var(--text2)] flex-shrink-0" />
                  <span className="font-dm text-sm text-[var(--text2)]">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
          <div className="p-5 rounded-xl border flex flex-col gap-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,232,122,0.08), rgba(77,159,255,0.06))', borderColor: 'rgba(0,232,122,0.25)' }}>
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[var(--green)] opacity-10 blur-2xl" />
            <div className="flex items-center justify-between">
              <p className="font-syne font-bold text-[16px] text-[var(--text)]">Pro</p>
              <Badge variant="green" dot>Popular</Badge>
            </div>
            <p className="font-syne font-extrabold text-[28px] text-[var(--text)] leading-none">₹999<span className="text-[var(--text3)] text-sm font-dm font-normal">/mo</span></p>
            <div className="flex flex-col gap-2">
              {planFeatures.pro.map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={13} className="text-[var(--green)] flex-shrink-0" />
                  <span className="font-dm text-sm text-[var(--text)]">{f}</span>
                </div>
              ))}
            </div>
            <Button variant="primary" size="md" icon={Crown} onClick={() => setUpgradeOpen(true)}>Upgrade to Pro</Button>
          </div>
        </div>
      </Section>

      {/* Security & session */}
      <Section title="Security" icon={Shield}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-dm text-[15px] font-medium text-[var(--text)]">Sign out of this session</p>
            <p className="font-mono text-xs text-[var(--text3)]">You'll need to sign in again to access your account</p>
          </div>
          <Button variant="danger" size="sm" icon={LogOut} onClick={() => signOut()}>Sign Out</Button>
        </div>
      </Section>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}

