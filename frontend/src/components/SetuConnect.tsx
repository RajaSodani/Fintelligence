import { useState, useEffect } from 'react'
import { coreApi } from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { CheckCircle, Landmark, Loader2, RefreshCw } from 'lucide-react'

type Status = 'idle' | 'loading' | 'pending' | 'active' | 'syncing' | 'synced' | 'error'

interface Props {
  onSuccess?: () => void
  className?: string
}

export function SetuConnect({ onSuccess, className }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [syncing, setSyncing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [mobileNumber, setMobileNumber] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [consentUrl, setConsentUrl] = useState<string | null>(null)

  // On mount, check if user already has an active consent
  useEffect(() => {
    coreApi.get('/api/v1/setu/consent/status').then(({ data }) => {
      if (data.status === 'ACTIVE') setStatus('active')
      else if (data.status === 'PENDING') {
        setStatus('pending')
        setConsentUrl(data.consentUrl)
      }
    }).catch(() => {})
  }, [])

  // Poll for consent approval while pending — stop after 2 minutes
  useEffect(() => {
    if (status !== 'pending') return

    const TIMEOUT_MS = 2 * 60 * 1000
    const startedAt = Date.now()
    const interval = setInterval(async () => {
      if (Date.now() - startedAt >= TIMEOUT_MS) {
        clearInterval(interval)
        await coreApi.post('/api/v1/setu/consent/expire').catch(() => {})
        setStatus('error')
        setErrorMsg('Consent approval timed out. Please try again.')
        return
      }
      try {
        const { data } = await coreApi.get('/api/v1/setu/consent/status')
        if (data.status === 'ACTIVE') {
          setStatus('active')
          clearInterval(interval)
        } else if (data.status === 'FAILED' || data.status === 'EXPIRED') {
          setStatus('error')
          setErrorMsg('Consent was not approved. Please try again.')
          clearInterval(interval)
        }
      } catch {}
    }, 4000)
    return () => clearInterval(interval)
  }, [status])

  const handleInitiate = async () => {
    if (!mobileNumber.match(/^\d{10}$/)) {
      setErrorMsg('Enter a valid 10-digit mobile number')
      return
    }
    setStatus('loading')
    setErrorMsg(null)
    try {
      const { data } = await coreApi.post('/api/v1/setu/consent/initiate', { mobileNumber })
      setConsentUrl(data.url)
      setStatus('pending')
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      setStatus('error')
      setErrorMsg('Failed to initiate consent. Please try again.')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setErrorMsg(null)
    try {
      await coreApi.post('/api/v1/setu/sync')
      setStatus('synced')
      window.dispatchEvent(new CustomEvent('finmind:sync'))
      onSuccess?.()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setStatus('error')
      setErrorMsg(msg ?? 'Sync failed. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  if (status === 'synced') {
    return (
      <div className={cn('flex items-center gap-2 text-[var(--green)] text-sm font-medium', className)}>
        <CheckCircle size={16} />
        Data synced successfully
      </div>
    )
  }

  if (status === 'active') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center gap-2 text-[var(--green)] text-sm font-medium mb-1">
          <CheckCircle size={16} />
          Consent active
        </div>
        <Button onClick={handleSync} disabled={syncing} className="flex items-center gap-2">
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Sync Bank Data'}
        </Button>
        {errorMsg && <p className="text-xs text-[var(--red)]">{errorMsg}</p>}
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="flex items-center gap-1.5">
          <Loader2 size={14} className="animate-spin text-[var(--amber)]" />
          <span className="text-sm text-[var(--amber)] font-medium">Waiting for consent approval…</span>
        </div>
        <p className="text-xs text-[var(--text3)]">
          Approve the request in your bank&apos;s AA app, then come back here.
        </p>
        {consentUrl && (
          <button
            onClick={() => window.open(consentUrl, '_blank', 'noopener,noreferrer')}
            className="text-xs text-[var(--green)] underline text-left"
          >
            Re-open consent link
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showInput ? (
        <>
          <div className="flex gap-2">
            <input
              type="tel"
              maxLength={10}
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number"
              className="flex-1 bg-[var(--bg3)] border border-[var(--border2)] rounded-xl px-4 py-2.5 text-sm text-[var(--text)] font-mono placeholder:text-[var(--text3)] focus:outline-none focus:border-[rgba(0,232,122,0.4)]"
            />
            <Button
              onClick={handleInitiate}
              disabled={status === 'loading'}
              className="flex items-center gap-2 flex-shrink-0"
            >
              {status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : 'Connect'}
            </Button>
          </div>
          <p className="text-xs text-[var(--text3)]">Your number is used only to route the AA consent request.</p>
        </>
      ) : (
        <Button onClick={() => setShowInput(true)} className="flex items-center gap-2">
          <Landmark size={15} />
          Connect Your Bank
        </Button>
      )}
      {errorMsg && <p className="text-xs text-[var(--red)]">{errorMsg}</p>}
    </div>
  )
}
