import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { loginGoogle, logout } from '../../auth/actions'
import { NotConfigured } from '../../components/NotConfigured'
import { PlatformShell } from '../../components/PlatformShell'
import { Alert, Spinner } from '../../components/ui'
import { countOrders, getDisabledTemplates, listAllStores, setDisabledTemplates, setStoreActive } from '../../lib/db'
import { firebaseConfigured } from '../../lib/firebase'
import { applySeo } from '../../lib/seo'
import type { Store } from '../../lib/types'
import { pathStoreUrl, subdomainUrl } from '../../lib/urls'
import { getTemplate, TEMPLATES } from '../../templates'

const DOMAIN_LABEL = { none: 'Chưa trỏ', pending: 'Đang chờ gắn', done: 'Đã xong' } as const

async function mapLimit<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++
        out[k] = await fn(items[k])
      }
    }),
  )
  return out
}

function Dashboard() {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({})
  const [disabled, setDisabled] = useState<string[]>([])
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'domain'>('all')

  useEffect(() => {
    listAllStores().then(
      async (s) => {
        setStores(s)
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const counts = await mapLimit(s, 6, (x) => countOrders(x.id, start).catch(() => 0))
        setTodayCounts(Object.fromEntries(s.map((x, k) => [x.id, counts[k]])))
      },
      (e) => setErr((e as Error).message),
    )
    getDisabledTemplates().then(setDisabled)
  }, [])

  const toggleStore = async (s: Store) => {
    try {
      await setStoreActive(s.id, !s.active)
      setStores((l) => (l || []).map((x) => (x.id === s.id ? { ...x, active: !s.active } : x)))
    } catch (e) {
      setErr((e as Error).message)
    }
  }
  const toggleTemplate = async (id: string) => {
    const next = disabled.includes(id) ? disabled.filter((x) => x !== id) : [...disabled, id]
    try {
      await setDisabledTemplates(next)
      setDisabled(next)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  const shown = useMemo(() => {
    const nq = q.toLowerCase()
    return (stores || []).filter(
      (s) =>
        (!nq || `${s.name} ${s.slug} ${s.ownerEmail} ${s.customDomain}`.toLowerCase().includes(nq)) &&
        (filter === 'all' || (filter === 'active' ? s.active : filter === 'paused' ? !s.active : Boolean(s.customDomain))),
    )
  }, [stores, q, filter])

  if (err) return <Alert>{err}</Alert>
  if (!stores) return <Spinner />
  const totalToday = Object.values(todayCounts).reduce((a, b) => a + b, 0)
  const pendingDomains = stores.filter((s) => s.customDomain && s.domainStatus !== 'done')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card text-center"><div className="text-2xl font-extrabold" data-testid="stat-stores">{stores.length}</div><div className="text-xs text-slate-500">Tổng cửa hàng</div></div>
        <div className="card text-center"><div className="text-2xl font-extrabold">{stores.filter((s) => s.active).length}</div><div className="text-xs text-slate-500">Đang hoạt động</div></div>
        <div className="card text-center"><div className="text-2xl font-extrabold" data-testid="stat-orders-today">{totalToday}</div><div className="text-xs text-slate-500">Đơn hôm nay</div></div>
        <div className="card text-center"><div className="text-2xl font-extrabold">{pendingDomains.length}</div><div className="text-xs text-slate-500">Tên miền chờ gắn</div></div>
      </div>

      {pendingDomains.length > 0 && (
        <div className="card">
          <h2 className="font-bold">Tên miền riêng cần gắn trên Vercel</h2>
          <p className="text-xs text-slate-500">Vercel → Project vhp-shop → Settings → Domains → Add → nhập tên miền.</p>
          <ul className="mt-2 space-y-1 text-sm">
            {pendingDomains.map((s) => (
              <li key={s.id} className="flex justify-between gap-2"><code className="break-all">{s.customDomain}</code><span className="shrink-0 text-slate-500">{s.name} · {DOMAIN_LABEL[s.domainStatus]}</span></li>
            ))}
          </ul>
        </div>
      )}

      <section>
        <h2 className="text-lg font-bold">Cửa hàng</h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input type="search" className="field" placeholder="Tìm theo tên, tên miền, email chủ..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm cửa hàng" />
          <select className="field sm:w-48" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Lọc">
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="paused">Đang tắt</option>
            <option value="domain">Có tên miền riêng</option>
          </select>
        </div>
        <ul className="mt-3 space-y-2">
          {shown.map((s) => (
            <li key={s.id} className="card flex items-center gap-3 p-3" data-testid="admin-store">
              <span className="text-2xl">{getTemplate(s.template).icon}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{s.name}</div>
                <a href={pathStoreUrl(s.slug)} target="_blank" rel="noreferrer" className="block truncate text-xs text-indigo-700">{subdomainUrl(s.slug).replace('https://', '')}</a>
                <div className="truncate text-xs text-slate-500">
                  {s.ownerEmail} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : ''} · hôm nay {todayCounts[s.id] ?? '…'} đơn
                </div>
              </div>
              <label className="flex shrink-0 cursor-pointer flex-col items-center gap-0.5 text-[11px]">
                <input type="checkbox" className="peer sr-only" checked={s.active} onChange={() => toggleStore(s)} aria-label={`Bật/tắt ${s.name}`} />
                <span className="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
                {s.active ? 'Bật' : 'Tắt'}
              </label>
            </li>
          ))}
          {!shown.length && <li className="py-6 text-center text-slate-500">Không có cửa hàng.</li>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold">Quản lý mẫu</h2>
        <p className="text-xs text-slate-500">Mẫu bị tắt sẽ không hiện khi khách tạo cửa hàng mới (cửa hàng đang dùng không bị ảnh hưởng).</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const on = !disabled.includes(t.id)
            const used = stores.filter((s) => s.template === t.id).length
            return (
              <li key={t.id} className="card flex items-center gap-3 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg text-2xl" style={{ background: t.palette.bg, border: `2px solid ${t.palette.primary}` }}>{t.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-slate-500">{used} cửa hàng · <Link to={`/mau/${t.id}`} className="text-indigo-700">Xem mẫu</Link></div>
                </div>
                <button type="button" className={on ? 'btn-ghost' : 'btn-primary'} onClick={() => toggleTemplate(t.id)}>{on ? 'Tắt' : 'Bật'}</button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

export default function PlatformAdmin() {
  const { user, loading, isPlatformAdmin } = useAuth()
  const [err, setErr] = useState('')
  useEffect(() => applySeo({ title: 'Quản trị nền tảng – VHP Shop', description: 'Trang quản trị nền tảng VHP Shop.' }), [])
  if (!firebaseConfigured) return <NotConfigured />
  let body
  if (loading) body = <Spinner />
  else if (!isPlatformAdmin)
    body = (
      <div className="card mx-auto max-w-sm space-y-3 text-center">
        <div className="text-4xl">🔒</div>
        <h1 className="text-lg font-bold">Khu vực quản trị nền tảng</h1>
        <p className="text-sm text-slate-600">Chỉ tài khoản Google của chủ nền tảng mới truy cập được.</p>
        {user && <Alert kind="warn">Bạn đang đăng nhập bằng {user.email} – không có quyền truy cập.</Alert>}
        {err && <Alert>{err}</Alert>}
        <button
          type="button"
          className="btn-primary w-full"
          onClick={async () => {
            setErr('')
            try {
              if (user) await logout()
              await loginGoogle()
            } catch (e) {
              setErr((e as Error).message)
            }
          }}
        >
          Đăng nhập bằng Google
        </button>
      </div>
    )
  else body = <Dashboard />
  return (
    <PlatformShell wide>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-extrabold">Quản trị nền tảng</h1>
        {body}
      </div>
    </PlatformShell>
  )
}
