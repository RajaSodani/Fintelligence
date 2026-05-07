import { useUser as useClerkUser } from '@clerk/clerk-react'
import type { User } from '@/types'

export function useUser(): { user: User | null; isLoaded: boolean } {
  const { user: clerkUser, isLoaded } = useClerkUser()

  if (!isLoaded || !clerkUser) {
    return { user: null, isLoaded }
  }

  const user: User = {
    id: clerkUser.id,
    firstName: clerkUser.firstName ?? '',
    lastName: clerkUser.lastName ?? '',
    email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
    imageUrl: clerkUser.imageUrl,
  }

  return { user, isLoaded }
}
