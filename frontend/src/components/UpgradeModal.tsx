import { useState } from 'react'
import { coreApi } from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { X, Check, Loader2, Zap } from 'lucide-react'

const PRO_FEATURES = [
  'Unlimited AI chat messages',
  'Multi-agent stock research',
  'Real-time price alerts',
  'Advanced cashflow prediction',
]

interface Props {
  open: boolean
  onClose: () => void
}

export function UpgradeModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const { data } = await coreApi.post('/api/v1/stripe/create-checkout-session')
      window.location.href = data.url
    } catch {
      setError('Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={cn(
        'relative z-10 w-full max-w-md rounded-2xl p-6',
        'bg-[var(--bg2)] border border-[var(--border)]',
        'shadow-[0_24px_80px_rgba(0,0,0,0.6)]',
      )}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text3)] hover:text-[var(--text1)] transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
            <Zap size={20} className="text-[var(--gold)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text1)]">Upgrade to Pro</h2>
            <p className="text-xs text-[var(--text3)]">Unlock your full financial intelligence</p>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-[var(--text2)]">
              <span className="w-5 h-5 rounded-full bg-[var(--green)]/15 flex items-center justify-center flex-shrink-0">
                <Check size={11} className="text-[var(--green)]" />
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-3xl font-bold text-[var(--text1)]">₹799</span>
          <span className="text-sm text-[var(--text3)]">/month</span>
        </div>

        {error && <p className="text-xs text-[var(--red)] mb-4">{error}</p>}

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[var(--gold)] text-black font-semibold hover:bg-[var(--gold)]/90"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Redirecting to checkout...
            </>
          ) : (
            'Upgrade Now'
          )}
        </Button>

        <p className="text-center text-xs text-[var(--text3)] mt-3">
          Secure payment via Stripe · Cancel anytime
        </p>
      </div>
    </div>
  )
}
