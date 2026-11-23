import { useState, type FormEvent } from 'react'
import { Alert, Modal } from '../../components/ui'
import { deleteProduct, getProductMedia, saveProduct, type ProductInput } from '../../lib/db'
import { compressImage, dataUrlKB, IMAGE_LIMITS, isImageUrl, MAX_UPLOADS_PER_PRODUCT } from '../../lib/image'
import { formatVND } from '../../lib/money'
import type { Product } from '../../lib/types'
import { getTemplate } from '../../templates'
import { useAuth } from '../../auth/AuthContext'
import { canAddProduct, effectivePlan, formatLimit, limitsFor, PLAN_LABEL, productLimitMessage } from '../../lib/plans'
import { usePlatformConfig } from '../../lib/usePlatformConfig'
import { useDash } from './DashContext'

interface Draft {
  id: string | null
  name: string
  price: string
  oldPrice: string
  stock: string
  category: string
  description: string
  urls: string
  uploads: string[]
  specs: Record<string, string>
  sizes: string[]
  active: boolean
}

function toDraft(p: Product | null, defaultCat: string): Draft {
  return {
    id: p?.id || null,
    name: p?.name || '',
    price: p ? String(p.price) : '',
    oldPrice: p?.oldPrice ? String(p.oldPrice) : '',
    stock: p ? String(p.stock) : '10',
    category: p?.category || defaultCat,
    description: p?.description || '',
    urls: (p?.images || []).join('\n'),
    uploads: [],
    specs: { ...(p?.specs || {}) },
    sizes: [...(p?.sizes || [])],
    active: p ? p.active : true,
  }
}

function usePlanLimits() {
  const { account } = useAuth()
  const { plans } = usePlatformConfig()
  const plan = effectivePlan(account)
  return { plan, limits: limitsFor(plans, plan) }
}

function Editor({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const { store, setStore, reloadProducts } = useDash()
  const { plan, limits } = usePlanLimits()
  const t = getTemplate(store.template)
  const [d, setD] = useState(initial)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [imgBusy, setImgBusy] = useState(false)
  const [customCat, setCustomCat] = useState(!t.categories.includes(initial.category) && initial.category !== '')
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setErr('')
    const room = MAX_UPLOADS_PER_PRODUCT - d.uploads.length
    if (room <= 0) return setErr(`Tối đa ${MAX_UPLOADS_PER_PRODUCT} ảnh tải lên cho mỗi sản phẩm.`)
    setImgBusy(true)
    try {
      const out: string[] = []
      for (const f of Array.from(files).slice(0, room)) {
        if (f.size > 8 * 1024 * 1024) throw new Error(`Ảnh "${f.name}" quá lớn (tối đa 8 MB trước khi nén).`)
        out.push(await compressImage(f, IMAGE_LIMITS.product))
      }
      setD((x) => ({ ...x, uploads: [...x.uploads, ...out] }))
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setImgBusy(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    const urls = d.urls.split(/\s+/).map((s) => s.trim()).filter(Boolean)
    const bad = urls.find((u) => !isImageUrl(u))
    if (bad) return setErr(`Link ảnh không hợp lệ: ${bad}`)
    if (urls.length > 8) return setErr('Tối đa 8 link ảnh.')
    const price = Number(d.price)
    const oldPrice = Number(d.oldPrice || 0)
    const stock = Number(d.stock)
    if (!(price >= 0) || !Number.isFinite(price)) return setErr('Giá bán không hợp lệ.')
    if (oldPrice && oldPrice <= price) return setErr('Giá cũ phải lớn hơn giá bán (hoặc để trống).')
    if (!Number.isInteger(stock) || stock < 0) return setErr('Tồn kho phải là số nguyên ≥ 0.')
    setBusy(true)
    try {
      let thumb = ''
      if (d.uploads[0]) thumb = await compressImage(d.uploads[0], IMAGE_LIMITS.thumb)
      const specs: Record<string, string> = {}
      for (const f of t.specFields) if (d.specs[f.key]?.trim()) specs[f.key] = d.specs[f.key].trim().slice(0, 60)
      const data: ProductInput = {
        name: d.name.trim(),
        price: Math.round(price),
        oldPrice: Math.round(oldPrice),
        stock,
        category: d.category.trim(),
        description: d.description.trim(),
        images: urls,
        thumb,
        specs,
        sizes: d.sizes,
        active: d.active,
      }
      if (!d.id && !canAddProduct(limits, store.productCount ?? 0)) throw new Error(productLimitMessage(limits?.maxProducts ?? 0))
      await saveProduct(store.id, d.id, data, d.uploads, store.productCount ?? 0)
      if (!d.id) setStore({ ...store, productCount: (store.productCount ?? 0) + 1 })
      await reloadProducts()
      onClose()
    } catch (e2) {
      const denied = (e2 as { code?: string }).code === 'permission-denied'
      setErr(denied && !d.id && plan === 'free' && limits?.maxProducts ? productLimitMessage(limits.maxProducts) : denied ? 'Không lưu được: dữ liệu không hợp lệ hoặc vượt giới hạn dung lượng.' : (e2 as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const totalKB = d.uploads.reduce((s, u) => s + dataUrlKB(u), 0)

  return (
    <form onSubmit={submit} className="space-y-3">
      {err && <Alert>{err}</Alert>}
      <div>
        <label className="label" htmlFor="p-name">Tên sản phẩm</label>
        <input id="p-name" className="field" value={d.name} onChange={(e) => set('name', e.target.value)} required maxLength={120} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label" htmlFor="p-price">Giá bán (₫)</label>
          <input id="p-price" className="field" type="number" inputMode="numeric" min={0} value={d.price} onChange={(e) => set('price', e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="p-old">Giá cũ (₫)</label>
          <input id="p-old" className="field" type="number" inputMode="numeric" min={0} value={d.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="p-stock">Tồn kho</label>
          <input id="p-stock" className="field" type="number" inputMode="numeric" min={0} value={d.stock} onChange={(e) => set('stock', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="p-cat">Danh mục</label>
        {customCat ? (
          <div className="flex gap-2">
            <input id="p-cat" className="field" value={d.category} onChange={(e) => set('category', e.target.value)} required maxLength={40} placeholder="Tên danh mục mới" />
            <button type="button" className="btn-ghost shrink-0" onClick={() => { setCustomCat(false); set('category', t.categories[0]) }}>Chọn sẵn</button>
          </div>
        ) : (
          <select id="p-cat" className="field" value={d.category} onChange={(e) => (e.target.value === '__new' ? (setCustomCat(true), set('category', '')) : set('category', e.target.value))}>
            {t.categories.map((c) => <option key={c} value={c}>{t.categoryIcons[c]} {c}</option>)}
            <option value="__new">+ Danh mục khác...</option>
          </select>
        )}
      </div>
      {t.specFields.length > 0 && (
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm font-semibold">Thông số ({t.name})</legend>
          <div className="grid grid-cols-2 gap-2">
            {t.specFields.map((f) => (
              <div key={f.key}>
                <label className="label text-xs" htmlFor={`spec-${f.key}`}>{f.label}{f.suffix ? ` (${f.suffix})` : ''}</label>
                <input id={`spec-${f.key}`} className="field" value={d.specs[f.key] || ''} placeholder={f.placeholder} maxLength={60} onChange={(e) => set('specs', { ...d.specs, [f.key]: e.target.value })} />
              </div>
            ))}
          </div>
        </fieldset>
      )}
      {t.sizeOptions.length > 0 && (
        <div>
          <span className="label">Size có sẵn</span>
          <div className="flex flex-wrap gap-2">
            {t.sizeOptions.map((s) => (
              <label key={s} className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold ${d.sizes.includes(s) ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-300'}`}>
                <input type="checkbox" className="sr-only" checked={d.sizes.includes(s)} onChange={(e) => set('sizes', e.target.checked ? t.sizeOptions.filter((x) => x === s || d.sizes.includes(x)) : d.sizes.filter((x) => x !== s))} />
                {s}
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="p-desc">Mô tả</label>
        <textarea id="p-desc" className="field" rows={3} maxLength={3000} value={d.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="rounded-lg border border-slate-200 p-3">
        <div className="text-sm font-semibold">Ảnh sản phẩm</div>
        <label className="label mt-2 text-xs" htmlFor="p-urls">Cách 1 – Dán link ảnh (mỗi dòng 1 link, tối đa 8)</label>
        <textarea id="p-urls" className="field font-mono text-xs" rows={2} value={d.urls} onChange={(e) => set('urls', e.target.value)} placeholder="https://..." />
        <div className="label mt-3 text-xs">Cách 2 – Tải ảnh từ máy (tối đa {MAX_UPLOADS_PER_PRODUCT} ảnh, tự nén còn ≤ {IMAGE_LIMITS.product.maxKB} KB/ảnh)</div>
        <div className="flex flex-wrap gap-2">
          {d.uploads.map((u, i) => (
            <div key={i} className="relative h-20 w-20">
              <img src={u} alt="" className="h-full w-full rounded object-cover" />
              <button type="button" onClick={() => set('uploads', d.uploads.filter((_, k) => k !== i))} className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-rose-600 text-sm text-white" aria-label="Xoá ảnh">×</button>
              <span className="absolute bottom-0 left-0 rounded-tr bg-black/60 px-1 text-[10px] text-white">{dataUrlKB(u)} KB</span>
            </div>
          ))}
          {d.uploads.length < MAX_UPLOADS_PER_PRODUCT && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-indigo-400">
              {imgBusy ? 'Đang nén...' : <><span className="text-2xl">+</span>Thêm ảnh</>}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { onFiles(e.target.files); e.target.value = '' }} aria-label="Tải ảnh sản phẩm" />
            </label>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">Đã dùng {totalKB} / {MAX_UPLOADS_PER_PRODUCT * IMAGE_LIMITS.product.maxKB} KB. Ảnh được lưu trực tiếp trong cơ sở dữ liệu (không dùng Cloud Storage).</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={d.active} onChange={(e) => set('active', e.target.checked)} /> Hiển thị trên cửa hàng
      </label>
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>Huỷ</button>
        <button className="btn-primary flex-1" disabled={busy || imgBusy}>{busy ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
      </div>
    </form>
  )
}

export default function ProductsTab() {
  const { store, setStore, products, reloadProducts } = useDash()
  const { plan, limits } = usePlanLimits()
  const count = store.productCount ?? products.length
  const full = !canAddProduct(limits, count)
  const t = getTemplate(store.template)
  const [editing, setEditing] = useState<Draft | null>(null)
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')

  const open = async (p: Product | null) => {
    setErr('')
    if (!p && full) return setErr(productLimitMessage(limits?.maxProducts ?? 0))
    const draft = toDraft(p, t.categories[0])
    if (p?.uploadCount) {
      try {
        draft.uploads = await getProductMedia(store.id, p.id)
      } catch {
        /* show without uploads */
      }
    }
    setEditing(draft)
  }

  const remove = async (p: Product) => {
    if (!confirm(`Xoá "${p.name}"?`)) return
    try {
      await deleteProduct(store.id, p.id, store.productCount ?? 0)
      if (store.productCount) setStore({ ...store, productCount: store.productCount - 1 })
      await reloadProducts()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <div className="flex gap-2">
        <input type="search" className="field" placeholder="Tìm sản phẩm..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm sản phẩm" />
        <button type="button" className="btn-primary shrink-0" onClick={() => open(null)}>+ Thêm</button>
      </div>
      <p className="mt-2 text-xs text-slate-500" data-testid="product-quota">
        Gói {PLAN_LABEL[plan]}: {count} sản phẩm{limits ? ` / ${formatLimit(limits.maxProducts, 'sản phẩm')}` : ''}
      </p>
      {err && <div className="mt-3"><Alert>{err}</Alert></div>}
      <ul className="mt-4 space-y-2">
        {list.map((p) => (
          <li key={p.id} className="card flex items-center gap-3 p-3" data-testid="dash-product">
            {p.thumb || p.images[0] ? <img src={p.thumb || p.images[0]} alt="" className="h-14 w-14 shrink-0 rounded object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-slate-100 text-2xl">{t.categoryIcons[p.category] || t.icon}</div>}
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{p.name}{!p.active && <span className="ml-1 text-xs text-slate-400">(ẩn)</span>}</div>
              <div className="text-sm text-slate-600">{formatVND(p.price)} · Kho: <b className={p.stock === 0 ? 'text-rose-600' : ''}>{p.stock}</b> · {p.category}</div>
            </div>
            <button type="button" className="btn-ghost px-2.5" onClick={() => open(p)} aria-label={`Sửa ${p.name}`}>Sửa</button>
            <button type="button" className="btn-ghost px-2.5 text-rose-600" onClick={() => remove(p)} aria-label={`Xoá ${p.name}`}>Xoá</button>
          </li>
        ))}
        {!list.length && <li className="py-10 text-center text-slate-500">Chưa có sản phẩm.</li>}
      </ul>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}>
        {editing && <Editor initial={editing} onClose={() => setEditing(null)} />}
      </Modal>
    </div>
  )
}
