import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { firebaseConfigured, getFirebaseAuth } from '../lib/firebase'
import { PLATFORM_ADMIN_EMAIL } from '../lib/env'
import type { UserAccount } from '../lib/types'

interface AuthState {
  user: User | null
  loading: boolean
  isPlatformAdmin: boolean
  /** Hồ sơ gói (Thường/VIP) của người dùng; null khi chưa đăng nhập hoặc chưa đọc được. */
  account: UserAccount | null
  accountLoading: boolean
  refreshAccount: () => Promise<void>
}

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  isPlatformAdmin: false,
  account: null,
  accountLoading: false,
  refreshAccount: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<{ user: User | null; loading: boolean; isPlatformAdmin: boolean }>({ user: null, loading: firebaseConfigured, isPlatformAdmin: false })
  const [account, setAccount] = useState<UserAccount | null>(null)
  const [accountLoading, setAccountLoading] = useState(false)

  const loadAccount = useCallback(async (user: User | null) => {
    if (!user) {
      setAccount(null)
      return
    }
    setAccountLoading(true)
    try {
      const { ensureUserAccount } = await import('../lib/db')
      setAccount(await ensureUserAccount(user))
    } catch {
      setAccount(null)
    } finally {
      setAccountLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!firebaseConfigured) return
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      const isPlatformAdmin =
        !!user &&
        user.email === PLATFORM_ADMIN_EMAIL &&
        user.emailVerified &&
        user.providerData.some((p) => p.providerId === 'google.com')
      setAuth({ user, loading: false, isPlatformAdmin })
      void loadAccount(user)
    })
  }, [loadAccount])

  const refreshAccount = useCallback(() => loadAccount(auth.user), [auth.user, loadAccount])
  return <Ctx.Provider value={{ ...auth, account, accountLoading, refreshAccount }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(Ctx)
}
