import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { PlatformShell } from '../../components/PlatformShell'
import { Alert, Spinner } from '../../components/ui'
import { AdminZaloLink, FreeClosedNotice, PlanBadge } from '../../components/PlanBits'
import { canChangeTemplate, canCreateStore, effectivePlan, limitsFor } from '../../lib/plans'
import { usePlatformConfig } from '../../lib/usePlatformConfig'
import { createStore, getDisabledTemplates, isSlugTaken } from '../../lib/db'
import { pathStoreLabel } from '../../lib/urls'
import { applySeo } from '../../lib/seo'
import { slugify, validateSlug } from '../../lib/slug'
import type { TemplateId } from '../../lib/types'
import { CATEGORIES, isTemplateId, TEMPLATES } from '../../templates'

type SlugState = 'idle' | 'checking' | 'free' | 'taken' | 'invalid'

export default function CreateStore() {
  const { user, account, accountLoading } = useAuth()
  const { plans, settings, loading: cfgLoading } = usePlatformConfig()
  const plan = effectivePlan(account)
  const limits = limitsFor(plans, plan)
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const initial = sp.get('mau') || ''
  const [step, setStep] = useState<1 | 2>(isTemplateId(initial) ? 2 : 1)
  const [template, setTemplate] = useState<TemplateId>(isTemplateId(initial) ? initial : 'quan-ao')
  const [disabled, setDisabled] = useState<string[]>([])
  const [name, setName] = useState('')
  const [slugInput, setSlugInput] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [phone, setPhone] = useState('')
  const [zalo, setZalo] = useState('')
  const [zaloSame, setZaloSame] = useState(true)
  const [address, setAddress] = useState('')
  const [samples, setSamples] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    applySeo({ title: 'Tạo cửa hàng – VHP Shop', description: 'Chọn mẫu và tạo website bán hàng riêng của bạn.' })
    getDisabledTemplates().then(setDisabled)
  }, [])

  const slug = slugEdited ? slugInput : slugify(name)
  const slugError = slug ? validateSlug(slug) : null
  const [check, setCheck] = useState<{ slug: string; state: SlugState; error?: string } | null>(null)
  useEffect(() => {
    if (!slug || slugError) return
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const taken = await isSlugTaken(slug)
        if (!cancelled) setCheck({ slug, state: taken ? 'taken' : 'free' })
      } catch {
        if (!cancelled) setCheck({ slug, state: 'invalid', error: 'Không kiểm tra được tên miền phụ, vui lòng thử lại.' })
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [slug, slugError])
  const slugState: SlugState = !slug ? 'idle' : slugError ? 'invalid' : check?.slug === slug ? check.state : 'checking'
  const slugMsg = slugError || (check?.slug === slug ? check.error : '') || ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setErr('')
    if (slugState !== 'free') return setErr('Vui lòng chọn tên miền phụ hợp lệ và chưa được sử dụng.')
    if (!/^[0-9+ .]{8,15}$/.test(phone.trim())) return setErr('Số điện thoại không hợp lệ.')
    setBusy(true)
    try {
      const id = await createStore(user, { name, slug, template, phone, zalo: zaloSame ? phone : zalo, address }, samples, limits?.maxProducts)
      nav(`/quan-ly/${id}?moi=1`, { replace: true })
    } catch (e2) {
      const code = (e2 as { code?: string }).code
      const blocked = code === 'permission-denied' && !canCreateStore(settings, account)
      setErr(blocked ? 'Hiện chỉ mở đăng ký VIP — liên hệ quản trị qua Zalo 0988474228' : code === 'permission-denied' ? 'Tên miền phụ vừa có người dùng, vui lòng chọn tên khác.' : (e2 as Error).message)
      if (code === 'permission-denied' && !blocked) setCheck({ slug, state: 'taken' })
    } finally {
      setBusy(false)
    }
  }

  if (cfgLoading || accountLoading) return <PlatformShell><Spinner full /></PlatformShell>
  if (!canCreateStore(settings, account))
    return (
      <PlatformShell>
        <div className="mx-auto max-w-lg px-4 py-10">
          <div className="card space-y-2 text-center">
            <div className="text-4xl">👑</div>
            <h1 className="text-xl font-bold">Tạo cửa hàng mới</h1>
            <Alert kind="warn"><FreeClosedNotice /></Alert>
          </div>
        </div>
      </PlatformShell>
    )

  return (
    <PlatformShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm font-semibold text-indigo-600">Bước {step}/2</p>
        <h1 className="text-2xl font-extrabold">{step === 1 ? 'Chọn mẫu giao diện' : 'Thông tin cửa hàng'}</h1>

        {step === 1 && (
          <>
            <p className="mt-1 text-sm text-slate-600">{TEMPLATES.length} mẫu · {CATEGORIES.length} ngành hàng – mỗi ngành 4 mẫu.</p>
            <div className="mt-2"><PlanBadge plan={plan} vipExpiresAt={account?.vipExpiresAt} /></div>
            {!canChangeTemplate(limits) && (
              <div className="mt-3" data-testid="template-lock-note">
                <Alert kind="info">
                  Gói Thường chọn 1 giao diện cho cửa hàng – sau khi tạo sẽ khoá. Đổi giao diện cần VIP (liên hệ <AdminZaloLink />).
                </Alert>
              </div>
            )}
            {CATEGORIES.map((c) => {
              const list = TEMPLATES.filter((t) => t.category === c.id && !disabled.includes(t.id))
              if (!list.length) return null
              return (
            <section key={c.id} className="mt-5" data-testid="template-group">
            <h2 className="text-sm font-bold text-slate-700">{c.icon} {c.name} <span className="font-normal text-slate-500">· {list.length} mẫu</span></h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {list.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  aria-pressed={template === t.id}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${template === t.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl"
                    style={{ background: t.palette.bg, border: `3px solid ${t.palette.primary}` }}
                  >
                    {t.icon}
                  </span>
                  <span>
                    <span className="block font-bold">{t.name}</span>
                    <span className="block text-xs text-slate-600">{t.tagline}</span>
                  </span>
                </button>
              ))}
            </div>
            </section>
              )
            })}
            <div className="mt-6 flex justify-end">
              <button type="button" className="btn-primary px-6 py-2.5" onClick={() => setStep(2)}>
                Tiếp tục
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <form onSubmit={submit} className="card mt-5 space-y-4 p-5">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
              <span>
                Mẫu đã chọn: <b>{TEMPLATES.find((t) => t.id === template)?.icon} {TEMPLATES.find((t) => t.id === template)?.name}</b>
              </span>
              <button type="button" className="font-semibold text-indigo-600" onClick={() => setStep(1)}>
                Đổi mẫu
              </button>
            </div>
            {err && <Alert>{err}</Alert>}
            <div>
              <label className="label" htmlFor="store-name">Tên cửa hàng</label>
              <input id="store-name" className="field" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required placeholder="VD: Tiệm Xe Minh Phát" />
            </div>
            <div>
              <label className="label" htmlFor="store-slug">Tên miền phụ</label>
              <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-300 focus-within:border-indigo-500">
                <input
                  id="store-slug"
                  className="min-w-0 flex-1 px-3 py-2 outline-none"
                  value={slug}
                  maxLength={30}
                  onChange={(e) => {
                    setSlugEdited(true)
                    setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }}
                  required
                />
              </div>
              <p className="mt-1 text-sm" aria-live="polite">
                {slugState === 'checking' && <span className="text-slate-500">Đang kiểm tra...</span>}
                {slugState === 'free' && <span className="text-emerald-600">✓ Có thể sử dụng: {pathStoreLabel(slug)}</span>}
                {slugState === 'taken' && <span className="text-rose-600">✗ Tên này đã có cửa hàng sử dụng, hãy sửa lại.</span>}
                {slugState === 'invalid' && <span className="text-rose-600">{slugMsg}</span>}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="store-phone">Số điện thoại</label>
                <input id="store-phone" type="tel" inputMode="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="0912345678" />
              </div>
              <div>
                <label className="label" htmlFor="store-zalo">Số Zalo</label>
                <input id="store-zalo" type="tel" inputMode="tel" className="field" value={zaloSame ? phone : zalo} disabled={zaloSame} onChange={(e) => setZalo(e.target.value)} />
                <label className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={zaloSame} onChange={(e) => setZaloSame(e.target.checked)} /> Giống số điện thoại
                </label>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="store-address">Địa chỉ cửa hàng</label>
              <textarea id="store-address" className="field" rows={2} maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Số nhà, đường, phường/xã, tỉnh/thành" />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={samples} onChange={(e) => setSamples(e.target.checked)} />
              <span>Thêm 6 sản phẩm mẫu để xem trước (có thể sửa / xoá sau)</span>
            </label>
            <button type="submit" disabled={busy || slugState !== 'free'} className="btn-primary w-full py-3 text-base">
              {busy ? 'Đang tạo cửa hàng...' : 'Tạo cửa hàng'}
            </button>
          </form>
        )}
      </div>
    </PlatformShell>
  )
}
