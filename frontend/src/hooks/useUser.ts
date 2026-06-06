import { useAuthContext } from '@/context/AuthContext'
import type { User } from '@/types'

// ── Clerk version (preserved for future switch-back) ──────────────────────
// import { useUser as useClerkUser } from '@clerk/clerk-react'
// const { user: clerkUser, isLoaded } = useClerkUser()
// return { id: clerkUser.id, firstName: clerkUser.firstName ?? '', ... }
// ──────────────────────────────────────────────────────────────────────────

export function useUser(): { user: User | null; isLoaded: boolean } {
  const { user: authUser, isLoaded } = useAuthContext()

  if (!isLoaded || !authUser) {
    return { user: null, isLoaded }
  }

  const user: User = {
    id: authUser.id,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    email: authUser.email,
    imageUrl: authUser.imageUrl,
  }

  return { user, isLoaded }
}
