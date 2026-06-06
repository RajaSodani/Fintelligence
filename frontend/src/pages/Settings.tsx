import { Building2, Crown, LogOut, Shield, Bell, Globe, Check, AlertTriangle, X, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
// import { useClerk } from '@clerk/clerk-react' // preserved for future switch-back
import { useAuthContext } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import { useAccounts } from '@/hooks/useAccounts'
import { useState } from 'react'
import { SetuConnect } from '@/components/SetuConnect'
import { UpgradeModal } from '@/components/UpgradeModal'

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
  const { signOut } = useAuthContext()
  const navigate = useNavigate()
  const openUserProfile = () => { /* profile editing in-page — no Clerk modal needed */ }
  const { accounts, loading: accountsLoading, refetch: refetchAccounts, deleteAccount } = useAccounts()
  const [notifications, setNotifications] = useState({ emailAlerts: true, weeklyReport: false })
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [connectBankToast, setConnectBankToast] = useState(false)
  const [confirmDeleteAccountId, setConfirmDeleteAccountId] = useState<string | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  const toggle = (key: keyof typeof notifications) =>
    setNotifications(n => ({ ...n, [key]: !n[key] }))

  const handleDeleteAccount = async (id: string) => {
    setDeletingAccountId(id)
    try {
      await deleteAccount(id)
      setConfirmDeleteAccountId(null)
    } finally {
      setDeletingAccountId(null)
    }
  }

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
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => openUserProfile()}>Edit Profile</Button>
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
          {accountsLoading ? (
            <div className="flex items-center justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : accounts.length === 0 ? (
            <p className="font-mono text-xs text-[var(--text3)] py-2">No accounts linked yet.</p>
          ) : (
            accounts.map((acc) => {
              const label = [acc.fipId, acc.subType ?? acc.type].filter(Boolean).join(' · ')
              const maskedNum = acc.maskedAccNumber ? `····${acc.maskedAccNumber.slice(-4)}` : ''
              const isConfirming = confirmDeleteAccountId === acc.id
              const isDeleting = deletingAccountId === acc.id
              return (
                <div
                  key={acc.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border)] group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg4)] flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-[var(--text2)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-dm text-[15px] font-medium text-[var(--text)] truncate">{acc.name}</p>
                    <p className="font-mono text-xs text-[var(--text3)]">
                      {label}{maskedNum ? ` · ${maskedNum}` : ''}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-[14px] text-[var(--text)]">
                      ₹{acc.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                    <Badge variant="green" dot className="mt-1">Connected</Badge>
                  </div>
                  {isConfirming ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="font-mono text-xs text-[var(--text3)]">Remove?</span>
                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        disabled={isDeleting}
                        className="font-mono text-xs text-[var(--red)] hover:underline disabled:opacity-50"
                      >
                        {isDeleting ? '…' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteAccountId(null)}
                        className="font-mono text-xs text-[var(--text3)] hover:text-[var(--text)]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteAccountId(acc.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text3)] hover:text-[var(--red)] flex-shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )
            })
          )}

          <div className="p-4 rounded-xl border border-dashed border-[var(--border2)]">
            <p className="font-mono text-xs text-[var(--text3)] mb-3">Setu AA · RBI-regulated · All major Indian banks</p>
            <SetuConnect onSuccess={refetchAccounts} />
          </div>

          {/* Coming-soon Setu connect button */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border)]">
            <div>
              <p className="font-dm text-[15px] font-medium text-[var(--text)]">Connect Bank</p>
              <p className="font-mono text-xs text-[var(--text3)]">Link your savings, demat, or loan accounts</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConnectBankToast(true)
                setTimeout(() => setConnectBankToast(false), 3000)
              }}
            >
              Connect
            </Button>
          </div>
          {connectBankToast && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(77,159,255,0.08)] border border-[rgba(77,159,255,0.2)]">
              <span className="font-mono text-xs text-[var(--blue)]">Bank connection via Setu is coming soon!</span>
            </div>
          )}
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell}>
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {[
            { key: 'emailAlerts',  label: 'Email Price Alerts',   desc: 'Get an email when a price alert triggers' },
            { key: 'weeklyReport', label: 'Weekly Portfolio Summary', desc: 'Portfolio performance summary every Sunday' },
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
          <Button variant="danger" size="sm" icon={LogOut} onClick={() => { signOut(); navigate('/auth/sign-in') }}>Sign Out</Button>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone" icon={AlertTriangle}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-dm text-[15px] font-medium text-[var(--text)]">Delete Account</p>
            <p className="font-mono text-xs text-[var(--text3)]">Permanently delete your account and all associated data</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>Delete Account</Button>
        </div>

        {showDeleteConfirm && (
          <div className="mt-4 p-4 rounded-xl bg-[rgba(255,77,106,0.06)] border border-[rgba(255,77,106,0.2)]">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-[var(--red)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-syne font-semibold text-[14px] text-[var(--text)] mb-1">Are you sure?</p>
                <p className="font-mono text-xs text-[var(--text3)] mb-3">This action cannot be undone. All your holdings, watchlist, alerts, and transaction history will be permanently deleted.</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(false)}>I understand, delete my account</Button>
                </div>
              </div>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-[var(--text3)] hover:text-[var(--text)]">
                <X size={15} />
              </button>
            </div>
          </div>
        )}
      </Section>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}

