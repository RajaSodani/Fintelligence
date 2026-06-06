import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  imageUrl?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoaded: boolean
  isSignedIn: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (token: string) => void
  signOut: () => void
}

const TOKEN_KEY = 'fintelligence_token'

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.userId,
      email: payload.email,
      firstName: payload.firstName ?? '',
      lastName: payload.lastName ?? '',
    }
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoaded: false,
    isSignedIn: false,
  })

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) {
      const user = decodeToken(stored)
      if (user) {
        setState({ user, token: stored, isLoaded: true, isSignedIn: true })
        return
      }
    }
    setState(s => ({ ...s, isLoaded: true }))
  }, [])

  const signIn = useCallback((token: string) => {
    const user = decodeToken(token)
    if (!user) return
    localStorage.setItem(TOKEN_KEY, token)
    setState({ user, token, isLoaded: true, isSignedIn: true })
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setState({ user: null, token: null, isLoaded: true, isSignedIn: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}

// Drop-in replacement for Clerk's useAuth
export function useAuth() {
  const { isLoaded, isSignedIn, user } = useAuthContext()
  return { isLoaded, isSignedIn, userId: user?.id ?? null }
}

// Drop-in replacement for Clerk's useClerk (only signOut needed in this app)
export function useClerkCompat() {
  const { signOut } = useAuthContext()
  const navigate = useNavigate()

  return {
    signOut: async (opts?: { redirectUrl?: string }) => {
      signOut()
      navigate(opts?.redirectUrl ?? '/auth/sign-in')
    },
    openUserProfile: () => {
      navigate('/settings')
    },
  }
}

// Route-guard components (replace Clerk's SignedIn / SignedOut)
export function SignedIn({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuthContext()
  return isSignedIn ? <>{children}</> : null
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuthContext()
  return !isSignedIn ? <>{children}</> : null
}
