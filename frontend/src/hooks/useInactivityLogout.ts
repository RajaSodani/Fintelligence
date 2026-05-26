import { useState, useEffect, useRef, useCallback } from 'react'
import { useClerk } from '@clerk/clerk-react'

const IDLE_MS = 30 * 60 * 1000   // 30 min
const WARN_MS = 28 * 60 * 1000   // warn at 28 min (2 min before logout)

export function useInactivityLogout() {
  const { signOut } = useClerk()
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(120)
  const idleTimer   = useRef<ReturnType<typeof setTimeout>>()
  const warnTimer   = useRef<ReturnType<typeof setTimeout>>()
  const countdownRef = useRef<ReturnType<typeof setInterval>>()

  const reset = useCallback(() => {
    clearTimeout(idleTimer.current)
    clearTimeout(warnTimer.current)
    clearInterval(countdownRef.current)
    setShowWarning(false)
    setSecondsLeft(120)

    warnTimer.current = setTimeout(() => {
      setShowWarning(true)
      setSecondsLeft(120)
      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) { clearInterval(countdownRef.current); return 0 }
          return s - 1
        })
      }, 1000)
    }, WARN_MS)

    idleTimer.current = setTimeout(() => {
      signOut()
    }, IDLE_MS)
  }, [signOut])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset))
      clearTimeout(idleTimer.current)
      clearTimeout(warnTimer.current)
      clearInterval(countdownRef.current)
    }
  }, [reset])

  return { showWarning, secondsLeft, extendSession: reset }
}
