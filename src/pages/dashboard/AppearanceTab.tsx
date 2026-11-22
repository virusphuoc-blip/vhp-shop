import { useState } from 'react'
import { Alert } from '../../components/ui'
import { defaultTheme, updateStore } from '../../lib/db'
import { compressImage, dataUrlKB, IMAGE_LIMITS, isImageUrl } from '../../lib/image'
import type { StoreTheme } from '../../lib/types'
import { getTemplate } from '../../templates'
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
      <div className="card">
        <div className="text-sm text-slate-600">Mẫu: <b>{t.icon} {t.name}</b> – {t.tagline}</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
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
