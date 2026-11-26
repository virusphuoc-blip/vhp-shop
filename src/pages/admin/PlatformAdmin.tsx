import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { loginGoogle, logout } from '../../auth/actions'
import { NotConfigured } from '../../components/NotConfigured'
import { PlatformShell } from '../../components/PlatformShell'
import { Alert, Spinner } from '../../components/ui'
import { countOrders, getDisabledTemplates, listAllStores, listUserAccounts, savePlansConfig, setDisabledTemplates, setFreeMode, setStoreActive, setUserPlan } from '../../lib/db'
import { PlanBadge } from '../../components/PlanBits'
import { addMonths, effectivePlan, formatLimit } from '../../lib/plans'
import { usePlatformConfig } from '../../lib/usePlatformConfig'
import { firebaseConfigured } from '../../lib/firebase'
import { applySeo } from '../../lib/seo'
import type { Plan, PlanLimits, PlansConfig, Store, UserAccount } from '../../lib/types'
import { pathStoreLabel, pathStoreUrl } from '../../lib/urls'
import { getTemplate, TEMPLATES } from '../../templates'
import { PaymentSettings, VipOrdersAdmin } from './VipPayments'

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

function PlanSettings() {
  const { plans, settings, loading, reload } = usePlatformConfig()
  const [draft, setDraft] = useState<Record<string, string> | null>(null)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  if (loading) return <Spinner />
  const freeOn = !settings || settings.freeMode
  const fields: [keyof PlansConfig, keyof PlanLimits, string][] = [
    ['free', 'maxTemplates', 'Thường – số giao diện tối đa'],
    ['free', 'maxProducts', 'Thường – số sản phẩm tối đa'],
    ['vip', 'maxTemplates', 'VIP – số giao diện tối đa'],
    ['vip', 'maxProducts', 'VIP – số sản phẩm tối đa'],
  ]
  const values = draft || Object.fromEntries(fields.map(([p, k]) => [`${p}.${k}`, plans ? String(plans[p][k]) : '']))
  const toggleFree = async () => {
    setMsg(null)
    setBusy(true)
    try {
      await setFreeMode(!freeOn)
      await reload()
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  const save = async () => {
    setMsg(null)
    const n = (k: string) => Number(values[k])
    const bad = fields.find(([p, k]) => !Number.isInteger(n(`${p}.${k}`)) || n(`${p}.${k}`) < (k === 'maxTemplates' ? 1 : 0) || values[`${p}.${k}`] === '')
    if (bad) return setMsg({ kind: 'error', text: `Giá trị không hợp lệ: ${bad[2]}. Số giao diện ≥ 1; số sản phẩm ≥ 0 (0 = không giới hạn).` })
    setBusy(true)
    try {
      await savePlansConfig({
        free: { maxTemplates: n('free.maxTemplates'), maxProducts: n('free.maxProducts') },
        vip: { maxTemplates: n('vip.maxTemplates'), maxProducts: n('vip.maxProducts') },
      })
      await reload()
      setDraft(null)
      setMsg({ kind: 'success', text: 'Đã lưu giới hạn gói.' })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="grid gap-3 md:grid-cols-2" data-testid="plan-settings">
      <div className="card space-y-2">
        <h2 className="font-bold">Chế độ miễn phí</h2>
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm">{freeOn ? 'BẬT – cho tạo tài khoản Thường mới' : 'TẮT – chỉ mở đăng ký VIP'}</span>
          <input type="checkbox" className="peer sr-only" checked={freeOn} disabled={busy} onChange={toggleFree} aria-label="Chế độ miễn phí" data-testid="free-mode-toggle" />
          <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
        </label>
        {!freeOn && settings?.freeClosedAt && (
          <p className="text-xs text-slate-500">Tắt lúc {new Date(settings.freeClosedAt).toLocaleString('vi-VN')}. Tài khoản Thường có từ trước vẫn dùng bình thường.</p>
        )}
      </div>
      <div className="card space-y-2">
        <h2 className="font-bold">Giới hạn gói</h2>
        {!plans && <Alert kind="warn">Chưa cấu hình giới hạn – hiện chưa giới hạn gói nào. Nhập số rồi bấm Lưu.</Alert>}
        <div className="grid grid-cols-2 gap-2">
          {fields.map(([p, k, label]) => (
            <label key={`${p}.${k}`} className="block">
              <span className="label text-xs">{label}</span>
              <input
                type="number"
                min={k === 'maxTemplates' ? 1 : 0}
                className="field"
                value={values[`${p}.${k}`]}
                onChange={(e) => setDraft({ ...values, [`${p}.${k}`]: e.target.value })}
                data-testid={`limit-${p}-${k}`}
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500">Giao diện: 1 = khoá mẫu đã chọn, ≥ 2 = được đổi mẫu. Sản phẩm: 0 = không giới hạn.</p>
        {plans && (
          <p className="text-xs text-slate-600">
            Đang áp dụng: Thường {formatLimit(plans.free.maxProducts, 'sản phẩm')} · VIP {formatLimit(plans.vip.maxProducts, 'sản phẩm')}
          </p>
        )}
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        <button type="button" className="btn-primary w-full" disabled={busy} onClick={save}>Lưu giới hạn</button>
      </div>
    </section>
  )
}

interface AccountRow {
  uid: string
  email: string
  account: UserAccount | null
  storeCount: number
  createdAt?: number
}

function Accounts({ stores }: { stores: Store[] }) {
  const [accounts, setAccounts] = useState<UserAccount[] | null>(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [busyUid, setBusyUid] = useState('')
  const [customDate, setCustomDate] = useState<Record<string, string>>({})
  const [now] = useState(() => Date.now())
  useEffect(() => {
    listUserAccounts().then(setAccounts, (e) => setErr((e as Error).message))
  }, [])
  const rows = useMemo<AccountRow[]>(() => {
    const map = new Map<string, AccountRow>()
    for (const a of accounts || []) map.set(a.uid, { uid: a.uid, email: a.email, account: a, storeCount: 0, createdAt: a.createdAt })
    for (const s of stores) {
      const r = map.get(s.ownerUid) || { uid: s.ownerUid, email: s.ownerEmail, account: null, storeCount: 0, createdAt: s.createdAt }
      r.storeCount++
      if (s.createdAt && (!r.createdAt || s.createdAt < r.createdAt)) r.createdAt = r.account?.createdAt ?? s.createdAt
      map.set(s.ownerUid, r)
    }
    const nq = q.toLowerCase()
    return [...map.values()].filter((r) => !nq || r.email.toLowerCase().includes(nq)).sort((a, b) => a.email.localeCompare(b.email))
  }, [accounts, stores, q])

  const apply = async (r: AccountRow, plan: Plan, expires: Date | null) => {
    setErr('')
    setBusyUid(r.uid)
    try {
      await setUserPlan({ uid: r.uid, email: r.email, createdAt: r.createdAt }, plan, expires)
      setAccounts(await listUserAccounts())
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusyUid('')
    }
  }
  if (!accounts && !err) return <Spinner />
  return (
    <section data-testid="accounts">
      <h2 className="text-lg font-bold">Tài khoản & gói</h2>
      <input type="search" className="field mt-2" placeholder="Tìm theo email..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm tài khoản" />
      {err && <div className="mt-2"><Alert>{err}</Alert></div>}
      <ul className="mt-3 space-y-2">
        {rows.map((r) => {
          const plan = effectivePlan(r.account, now)
          const vipValid = plan === 'vip'
          const base = vipValid && r.account?.vipExpiresAt ? r.account.vipExpiresAt : now
          const busy = busyUid === r.uid
          return (
            <li key={r.uid} className="card space-y-2 p-3" data-testid="account-row">
              <div className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate font-semibold">{r.email || r.uid}</span>
                <PlanBadge plan={plan} vipExpiresAt={r.account?.vipExpiresAt} />
              </div>
              <div className="text-xs text-slate-500">
                {r.storeCount} cửa hàng
                {r.account?.plan === 'vip' && !vipValid && r.account.vipExpiresAt ? ` · VIP đã hết hạn ${new Date(r.account.vipExpiresAt).toLocaleDateString('vi-VN')}` : ''}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[1, 3, 6, 12].map((m) => (
                  <button key={m} type="button" disabled={busy} className="btn-ghost px-2.5 py-1 text-xs" onClick={() => apply(r, 'vip', addMonths(base, m))}>
                    {vipValid ? `Gia hạn ${m} tháng` : `VIP ${m} tháng`}
                  </button>
                ))}
                {r.account?.plan === 'vip' && (
                  <button type="button" disabled={busy} className="btn-ghost px-2.5 py-1 text-xs text-rose-600" onClick={() => apply(r, 'free', null)}>
                    Thu hồi VIP (về Thường)
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  className="field py-1 text-xs"
                  value={customDate[r.uid] || ''}
                  onChange={(e) => setCustomDate({ ...customDate, [r.uid]: e.target.value })}
                  aria-label={`Hạn VIP tuỳ chọn cho ${r.email}`}
                />
                <button
                  type="button"
                  disabled={busy || !customDate[r.uid]}
                  className="btn-primary shrink-0 px-3 py-1 text-xs"
                  onClick={() => apply(r, 'vip', new Date(`${customDate[r.uid]}T23:59:59`))}
                >
                  Đặt hạn VIP
                </button>
              </div>
            </li>
          )
        })}
        {!rows.length && <li className="py-6 text-center text-slate-500">Chưa có tài khoản.</li>}
      </ul>
    </section>
  )
}

function Dashboard() {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [todayCounts, setTodayCounts] = useState<Record<string, number>>({})
  const [disabled, setDisabled] = useState<string[]>([])
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'domain'>('all')
  const [accountsKey, setAccountsKey] = useState(0)

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

      <PlanSettings />

      <PaymentSettings />

      <VipOrdersAdmin onChanged={() => setAccountsKey((k) => k + 1)} />

      <Accounts key={accountsKey} stores={stores} />

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
                <a href={pathStoreUrl(s.slug)} target="_blank" rel="noreferrer" className="block truncate text-xs text-indigo-700">{pathStoreLabel(s.slug)}</a>
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
