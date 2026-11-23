import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductGrid } from './ProductBits'
import { useStore } from './StoreContext'

const PRICE_RANGES = [
  { id: '', label: 'Mọi mức giá', min: 0, max: Infinity },
  { id: 'u100', label: 'Dưới 100.000₫', min: 0, max: 100000 },
  { id: '100-500', label: '100.000₫ – 500.000₫', min: 100000, max: 500000 },
  { id: '500-2m', label: '500.000₫ – 2 triệu', min: 500000, max: 2000000 },
  { id: '2m-30m', label: '2 – 30 triệu', min: 2000000, max: 30000000 },
  { id: 'o30m', label: 'Trên 30 triệu', min: 30000000, max: Infinity },
]

function norm(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
}

export default function ProductList() {
  const { products, template } = useStore()
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || ''
  const cat = sp.get('cat') || ''
  const price = sp.get('gia') || ''
  const size = sp.get('size') || ''
  const sort = sp.get('sx') || ''
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v)
    else n.delete(k)
    setSp(n, { replace: true })
  }
  const cats = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))], [products])
  const sizes = useMemo(() => {
    const all = new Set(products.flatMap((p) => p.sizes))
    return [...template.sizeOptions.filter((s) => all.has(s)), ...[...all].filter((s) => !template.sizeOptions.includes(s))]
  }, [products, template])
  const range = PRICE_RANGES.find((r) => r.id === price) || PRICE_RANGES[0]

  const list = useMemo(() => {
    const nq = norm(q.trim())
    const out = products.filter(
      (p) =>
        (!nq || norm(`${p.name} ${p.category} ${p.description} ${Object.values(p.specs).join(' ')}`).includes(nq)) &&
        (!cat || p.category === cat) &&
        p.price >= range.min &&
        p.price < range.max &&
        (!size || p.sizes.includes(size)),
    )
    if (sort === 'asc') out.sort((a, b) => a.price - b.price)
    if (sort === 'desc') out.sort((a, b) => b.price - a.price)
    return out
  }, [products, q, cat, range, size, sort])

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <h1 className="font-heading text-2xl font-bold">{cat || `Tất cả ${template.productWord}`}</h1>
      <div className="mt-3 space-y-3">
        <input
          type="search"
          className="s-field"
          placeholder={`Tìm ${template.productWord}...`}
          value={q}
          onChange={(e) => set('q', e.target.value)}
          aria-label="Tìm kiếm"
          autoFocus={template.category === 'tap-hoa'}
        />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Danh mục">
          {['', ...cats].map((c) => (
            <button
              key={c || 'all'}
              type="button"
              onClick={() => set('cat', c)}
              aria-pressed={cat === c}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${cat === c ? 'border-sp bg-sp font-semibold text-white' : 'border-sborder bg-ssurf'}`}
            >
              {c ? `${template.categoryIcons[c] || ''} ${c}` : 'Tất cả'}
            </button>
          ))}
        </div>
        {sizes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo size">
            <span className="text-sm text-smuted">Size:</span>
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('size', size === s ? '' : s)}
                aria-pressed={size === s}
                className={`min-w-10 border px-2 py-1 text-sm font-semibold ${size === s ? 'border-stext bg-stext text-sbg' : 'border-sborder bg-ssurf'}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <select className="s-field" value={price} onChange={(e) => set('gia', e.target.value)} aria-label="Lọc theo giá">
            {PRICE_RANGES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <select className="s-field" value={sort} onChange={(e) => set('sx', e.target.value)} aria-label="Sắp xếp">
            <option value="">Mới nhất</option>
            <option value="asc">Giá tăng dần</option>
            <option value="desc">Giá giảm dần</option>
          </select>
        </div>
      </div>
      <p className="mt-4 mb-3 text-sm text-smuted">{list.length} {template.productWord}</p>
      <ProductGrid products={list} />
    </div>
  )
}
