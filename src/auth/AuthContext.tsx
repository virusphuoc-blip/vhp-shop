import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { firebaseConfigured, getFirebaseAuth } from '../lib/firebase'
import { PLATFORM_ADMIN_EMAIL } from '../lib/env'

interface AuthState {
  user: User | null
  loading: boolean
  isPlatformAdmin: boolean
}

const Ctx = createContext<AuthState>({ user: null, loading: true, isPlatformAdmin: false })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: firebaseConfigured, isPlatformAdmin: false })
  useEffect(() => {
    if (!firebaseConfigured) return
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      const isPlatformAdmin =
        !!user &&
        user.email === PLATFORM_ADMIN_EMAIL &&
        user.emailVerified &&
        user.providerData.some((p) => p.providerId === 'google.com')
      setState({ user, loading: false, isPlatformAdmin })
    })
  }, [])
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(Ctx)
}
