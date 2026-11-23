import { useState } from 'react'
import { Alert } from '../../components/ui'
import { changeStoreTemplate, defaultTheme, updateStore } from '../../lib/db'
import { useAuth } from '../../auth/AuthContext'
import { AdminZaloLink } from '../../components/PlanBits'
import { canChangeTemplate, effectivePlan, limitsFor } from '../../lib/plans'
import { usePlatformConfig } from '../../lib/usePlatformConfig'
import type { TemplateId } from '../../lib/types'
import { compressImage, dataUrlKB, IMAGE_LIMITS, isImageUrl } from '../../lib/image'
import type { StoreTheme } from '../../lib/types'
import { CATEGORIES, getTemplate, TEMPLATES } from '../../templates'
import { useDash } from './DashContext'

function ImagePicker({ label, value, onChange, limit, transparent }: { label: string; value: string; onChange: (v: string) => void; limit: { maxDim: number; maxKB: number }; transparent?: boolean }) {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const isData = value.startsWith('data:')
  return (
    <div>
      <span className="label">{label}</span>
      {value && <img src={value} alt="" className={`mb-2 rounded-lg border object-cover ${transparent ? 'h-20 w-20' : 'h-28 w-full'}`} />}
      <input className="field text-xs" placeholder="Dán link ảnh https://..." value={isData ? '' : value} onChange={(e) => onChange(e.target.value.trim())} aria-label={`Link ${label}`} />
      <div className="mt-2 flex items-center gap-2">
        <label className="btn-ghost cursor-pointer">
          {busy ? 'Đang nén...' : 'Tải ảnh từ máy'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              setErr('')
              setBusy(true)
              try {
                onChange(await compressImage(f, { ...limit, transparent }))
              } catch (e2) {
                setErr((e2 as Error).message)
              } finally {
                setBusy(false)
              }
            }}
          />
        </label>
        {value && <button type="button" className="text-sm text-rose-600" onClick={() => onChange('')}>Xoá</button>}
        <span className="text-xs text-slate-500">{isData ? `${dataUrlKB(value)} KB / ` : 'Tối đa '}{limit.maxKB} KB</span>
      </div>
      {err && <p className="mt-1 text-sm text-rose-600">{err}</p>}
    </div>
  )
}

function TemplateSwitcher({ onChanged }: { onChanged: (theme: StoreTheme) => void }) {
  const { store, setStore } = useDash()
  const { account } = useAuth()
  const { plans } = usePlatformConfig()
  const allowed = canChangeTemplate(limitsFor(plans, effectivePlan(account)))
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const t = getTemplate(store.template)
  const pick = async (id: TemplateId) => {
    if (id === store.template) return
    if (!confirm(`Đổi sang mẫu "${getTemplate(id).name}"?`)) return
    setErr('')
    setBusy(true)
    try {
      const theme = await changeStoreTemplate(store, id)
      setStore({ ...store, template: id, theme })
      onChanged(theme)
      setOpen(false)
    } catch (e) {
      setErr((e as { code?: string }).code === 'permission-denied' ? 'Đổi giao diện cần VIP.' : (e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="card" data-testid="template-switcher">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{t.icon}</span>
        <div className="min-w-0 flex-1 text-sm">
          <div className="text-slate-500">Mẫu đang dùng</div>
          <div className="font-bold" data-testid="current-template">{t.name}</div>
          <div className="text-xs text-slate-600">{t.tagline}</div>
        </div>
        {allowed && (
          <button type="button" className="btn-ghost shrink-0" onClick={() => setOpen((x) => !x)}>
            {open ? 'Đóng' : 'Đổi mẫu'}
          </button>
        )}
      </div>
      {!allowed && (
        <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-900" data-testid="template-locked">
          🔒 Gói Thường dùng 1 giao diện. Đổi giao diện cần VIP — liên hệ quản trị qua <AdminZaloLink />.
        </p>
      )}
      {err && <div className="mt-3"><Alert>{err}</Alert></div>}
      {allowed && open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate-500">{TEMPLATES.length} mẫu – logo, banner và nội dung đã sửa được giữ nguyên.</p>
          {CATEGORIES.map((c) => (
            <section key={c.id}>
              <h3 className="text-sm font-bold text-slate-700">{c.icon} {c.name}</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {TEMPLATES.filter((x) => x.category === c.id).map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    disabled={busy}
                    onClick={() => pick(x.id)}
                    aria-pressed={x.id === store.template}
                    className={`flex items-center gap-2 rounded-xl border-2 p-2 text-left text-sm ${x.id === store.template ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl" style={{ background: x.palette.bg, border: `2px solid ${x.palette.primary}` }}>{x.icon}</span>
                    <span className="font-semibold">{x.name}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AppearanceTab() {
  const { store, setStore } = useDash()
  const t = getTemplate(store.template)
  const [theme, setTheme] = useState<StoreTheme>(store.theme)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof StoreTheme, v: string) => setTheme((x) => ({ ...x, [k]: v }))
  const save = async () => {
    setMsg(null)
    for (const k of ['logo', 'banner'] as const) {
      if (theme[k] && !theme[k].startsWith('data:') && !isImageUrl(theme[k])) return setMsg({ kind: 'error', text: `Link ${k === 'logo' ? 'logo' : 'banner'} không hợp lệ.` })
    }
    setBusy(true)
    try {
      await updateStore(store.id, { theme })
      setStore({ ...store, theme })
      setMsg({ kind: 'success', text: 'Đã lưu giao diện.' })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-4">
      <TemplateSwitcher onChanged={setTheme} />
      <div className="card">
        <div className="grid grid-cols-2 gap-3">
          {(['primary', 'accent'] as const).map((k) => (
            <label key={k} className="block">
              <span className="label">{k === 'primary' ? 'Màu chính' : 'Màu nhấn'}</span>
              <span className="flex items-center gap-2">
                <input type="color" value={theme[k]} onChange={(e) => set(k, e.target.value)} className="h-10 w-12 cursor-pointer rounded border" aria-label={k === 'primary' ? 'Màu chính' : 'Màu nhấn'} />
                <code className="text-xs">{theme[k]}</code>
              </span>
            </label>
          ))}
        </div>
        <button type="button" className="mt-2 text-sm text-indigo-600" onClick={() => setTheme((x) => ({ ...x, primary: defaultTheme(t.id).primary, accent: defaultTheme(t.id).accent }))}>Khôi phục màu mặc định của mẫu</button>
        <div className="mt-3 flex gap-2 rounded-lg p-3" style={{ background: t.palette.bg }}>
          <span className="rounded px-3 py-1.5 text-sm font-bold text-white" style={{ background: theme.primary }}>Nút chính</span>
          <span className="rounded px-3 py-1.5 text-sm font-bold text-white" style={{ background: theme.accent }}>-20%</span>
        </div>
      </div>
      <div className="card space-y-4">
        <ImagePicker label="Logo (vuông)" value={theme.logo} onChange={(v) => set('logo', v)} limit={IMAGE_LIMITS.logo} transparent />
        <ImagePicker label="Ảnh banner trang chủ" value={theme.banner} onChange={(v) => set('banner', v)} limit={IMAGE_LIMITS.banner} />
      </div>
      <div className="card space-y-3">
        <div>
          <label className="label" htmlFor="hero-title">Tiêu đề banner</label>
          <input id="hero-title" className="field" maxLength={80} value={theme.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="hero-sub">Mô tả ngắn banner</label>
          <textarea id="hero-sub" className="field" rows={2} maxLength={200} value={theme.heroSubtitle} onChange={(e) => set('heroSubtitle', e.target.value)} />
        </div>
      </div>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <button type="button" className="btn-primary w-full py-3" disabled={busy} onClick={save}>{busy ? 'Đang lưu...' : 'Lưu giao diện'}</button>
    </div>
  )
}
