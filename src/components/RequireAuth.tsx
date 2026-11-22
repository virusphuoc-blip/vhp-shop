import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { firebaseConfigured } from '../lib/firebase'
import { NotConfigured } from './NotConfigured'
import { Spinner } from './ui'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (!firebaseConfigured) return <NotConfigured />
  if (loading) return <Spinner full />
  if (!user) return <Navigate to={`/dang-nhap?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  return <>{children}</>
}
