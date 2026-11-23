import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { PlatformShell } from '../../components/PlatformShell'
import { Alert, Spinner } from '../../components/ui'
import { listMyStores } from '../../lib/db'
import { pathStoreLabel } from '../../lib/urls'
import type { Store } from '../../lib/types'
import { getTemplate } from '../../templates'

export default function MyStores() {
  const { user } = useAuth()
  const [stores, setStores] = useState<Store[] | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!user) return
    listMyStores(user.uid).then(setStores, (e) => setErr((e as Error).message))
  }, [user])
  if (err) return <PlatformShell><div className="mx-auto max-w-3xl p-4"><Alert>{err}</Alert></div></PlatformShell>
  if (!stores) return <PlatformShell><Spinner full /></PlatformShell>
  if (stores.length === 0) return <Navigate to="/tao-cua-hang" replace />
  return (
    <PlatformShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Cửa hàng của tôi</h1>
          <Link to="/tao-cua-hang" className="btn-primary">+ Tạo thêm</Link>
        </div>
        <ul className="mt-5 space-y-3">
          {stores.map((s) => (
            <li key={s.id} className="card flex items-center gap-3">
              <span className="text-3xl">{getTemplate(s.template).icon}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{s.name}</div>
                <div className="truncate text-sm text-slate-500">{pathStoreLabel(s.slug)}</div>
                {!s.active && <span className="text-xs font-semibold text-rose-600">Đang bị tạm khoá</span>}
              </div>
              <Link to={`/quan-ly/${s.id}`} className="btn-primary">Quản lý</Link>
            </li>
          ))}
        </ul>
      </div>
    </PlatformShell>
  )
}
