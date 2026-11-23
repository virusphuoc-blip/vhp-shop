import { Link } from 'react-router-dom'
import { Stars } from '../components/ui'
import { discountPercent, formatVND } from '../lib/money'
import type { Product } from '../lib/types'
import { ratingFor, useStore } from './StoreContext'

export function ProductImage({ p, className = '' }: { p: Product; className?: string }) {
  const { template } = useStore()
  const src = p.thumb || p.images[0]
  if (!src)
    return (
      <div className={`flex items-center justify-center bg-sborder/40 text-5xl ${className}`} aria-hidden="true">
        {template.categoryIcons[p.category] || template.icon}
      </div>
    )
  return <img src={src} alt={p.name} loading="lazy" className={`object-cover ${className}`} />
}

export function Price({ p, big }: { p: Product; big?: boolean }) {
  const off = discountPercent(p.price, p.oldPrice)
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-extrabold text-sp ${big ? 'text-2xl' : 'text-base'}`}>{formatVND(p.price)}</span>
      {off > 0 && (
        <>
          <span className="text-xs text-smuted line-through">{formatVND(p.oldPrice)}</span>
          <span className="rounded bg-sa px-1 text-[11px] font-bold text-white">-{off}%</span>
        </>
      )}
    </div>
  )
}

export function SpecChips({ p }: { p: Product }) {
  const { template } = useStore()
  const chips = template.specFields.filter((f) => f.chip && p.specs[f.key])
  if (!chips.length) return null
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {chips.map((f) => (
        <span key={f.key} className="rounded border border-sp/50 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-sp uppercase">
          {p.specs[f.key]}
          {f.suffix ? ` ${f.suffix}` : ''}
        </span>
      ))}
    </div>
  )
}

function StockBadge({ p }: { p: Product }) {
  if (p.stock > 0) return null
  return <span className="absolute top-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs font-bold text-white">Hết hàng</span>
}

export function ProductCard({ p }: { p: Product }) {
  const { template, link, reviews } = useStore()
  const r = ratingFor(reviews, p.id)
  const href = link(`san-pham/${p.id}`)
  const id = template.category

  if (id === 'cafe') {
    return (
      <Link to={href} className="flex gap-3 rounded-s border border-sborder bg-ssurf p-2.5 transition hover:border-sp" data-testid="product-card">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full">
          <ProductImage p={p} className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-lg leading-tight font-bold">{p.name}</h3>
            <span className="shrink-0 font-bold text-sp">{formatVND(p.price)}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-smuted">{p.description}</p>
          {p.stock <= 0 && <span className="text-xs font-semibold text-sa">Tạm hết</span>}
        </div>
      </Link>
    )
  }

  if (id === 'do-an') {
    return (
      <Link to={href} className="block overflow-hidden rounded-s bg-ssurf shadow-md transition hover:shadow-lg" data-testid="product-card">
        <div className="relative aspect-[4/3]">
          <ProductImage p={p} className="h-full w-full" />
          <StockBadge p={p} />
          <span className="absolute right-2 bottom-2 rounded-full bg-sp px-3 py-1 text-sm font-extrabold text-white shadow">{formatVND(p.price)}</span>
        </div>
        <div className="p-3">
          <h3 className="font-heading text-lg leading-tight font-bold">{p.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-smuted">{p.description}</p>
          {r.count > 0 && <Stars value={r.avg} size={13} />}
        </div>
      </Link>
    )
  }

  if (id === 'tap-hoa') {
    return (
      <Link to={href} className="flex flex-col overflow-hidden rounded-s border border-sborder bg-ssurf transition hover:border-sp" data-testid="product-card">
        <div className="relative aspect-square bg-white">
          <ProductImage p={p} className="h-full w-full" />
          <StockBadge p={p} />
        </div>
        <div className="flex flex-1 flex-col p-2">
          <h3 className="line-clamp-2 text-[13px] leading-snug font-medium">{p.name}</h3>
          {p.specs.unit && <span className="text-[11px] text-smuted">{p.specs.unit}</span>}
          <div className="mt-auto pt-1">
            <Price p={p} />
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={href}
      className={`group flex flex-col overflow-hidden rounded-s bg-ssurf transition ${id === 'do-choi' ? 'border-2 border-sborder shadow-[0_4px_0_var(--sborder)] hover:-translate-y-0.5' : id === 'xe-may' ? 'border border-sborder hover:border-sp' : 'hover:opacity-90'}`}
      data-testid="product-card"
    >
      <div className={`relative overflow-hidden ${id === 'quan-ao' ? 'aspect-[3/4]' : id === 'xe-may' || id === 'noi-that' ? 'aspect-[4/3]' : 'aspect-square'}`}>
        <ProductImage p={p} className="h-full w-full transition group-hover:scale-105" />
        <StockBadge p={p} />
      </div>
      <div className={`flex flex-1 flex-col ${id === 'quan-ao' ? 'px-0.5 py-2' : 'p-3'}`}>
        <h3 className={`line-clamp-2 leading-snug ${id === 'xe-may' ? 'font-heading text-lg font-semibold uppercase' : 'text-sm font-semibold'}`}>{p.name}</h3>
        <SpecChips p={p} />
        {id === 'quan-ao' && p.sizes.length > 0 && <p className="mt-0.5 text-[11px] tracking-wide text-smuted">Size: {p.sizes.join(' · ')}</p>}
        <div className="mt-auto pt-1.5">
          <Price p={p} />
          {r.count > 0 && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-smuted">
              <Stars value={r.avg} size={12} /> ({r.count})
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  const { template } = useStore()
  const cls =
    template.category === 'cafe'
      ? 'grid gap-3 md:grid-cols-2'
      : template.category === 'do-an'
        ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
        : template.category === 'tap-hoa'
          ? 'grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6'
          : template.category === 'quan-ao'
            ? 'grid grid-cols-2 gap-x-3 gap-y-5 lg:grid-cols-3'
            : 'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4'
  if (!products.length) return <p className="py-10 text-center text-smuted">Chưa có {template.productWord} nào phù hợp.</p>
  return (
    <div className={cls}>
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  )
}
