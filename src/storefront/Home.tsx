import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProductGrid } from './ProductBits'
import { useStore } from './StoreContext'

const TOY_COLORS = ['#ff5c8a', '#ffb703', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#06b6d4']

function Hero() {
  const { store, template, link } = useStore()
  const title = store.theme.heroTitle || template.heroTitle
  const sub = store.theme.heroSubtitle || template.heroSubtitle
  const banner = store.theme.banner
  const id = template.id

  if (id === 'xe-may') {
    return (
      <section className="relative overflow-hidden bg-black">
        {banner && <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,.9)_40%,transparent),repeating-linear-gradient(135deg,transparent_0_22px,rgba(249,115,22,.08)_22px_24px)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14">
          <p className="font-heading text-sm tracking-[0.3em] text-sp uppercase">{store.name}</p>
          <h1 className="font-heading mt-2 max-w-xl text-4xl leading-none font-bold text-white uppercase sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-md text-zinc-300">{sub}</p>
          <div className="mt-6 flex gap-3">
            <Link to={link('san-pham')} className="s-btn skew-x-[-8deg] px-6">Xem xe ngay</Link>
            {store.phone && <a href={`tel:${store.phone}`} className="s-btn-outline skew-x-[-8deg]">Gọi {store.phone}</a>}
          </div>
        </div>
        <div className="h-1.5 bg-[linear-gradient(90deg,var(--sp),var(--sa))]" />
      </section>
    )
  }

  if (id === 'do-choi') {
    return (
      <section className="relative overflow-hidden px-4 pt-10 pb-14">
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-[#ffb703]/40" />
        <div className="absolute top-10 -right-8 h-28 w-28 rounded-full bg-[#3b82f6]/30" />
        <div className="absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-[#22c55e]/30" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-2">
          <div className="text-center md:text-left">
            <h1 className="font-heading text-4xl leading-tight font-extrabold text-sp sm:text-5xl">{title}</h1>
            <p className="mt-2 text-lg text-smuted">{sub}</p>
            <Link to={link('san-pham')} className="s-btn mt-5 rounded-full px-8 py-3 text-base shadow-[0_5px_0_rgba(0,0,0,.15)]">Khám phá đồ chơi 🎈</Link>
          </div>
          {banner ? (
            <img src={banner} alt="" className="aspect-[4/3] w-full rounded-[2rem] border-4 border-white object-cover shadow-xl" />
          ) : (
            <div className="hidden text-center text-8xl md:block">🧸🚂🎨</div>
          )}
        </div>
      </section>
    )
  }

  if (id === 'quan-ao') {
    return (
      <section className="relative">
        {banner ? (
          <img src={banner} alt="" className="h-[60vh] max-h-[560px] w-full object-cover" />
        ) : (
          <div className="h-[46vh] w-full bg-[linear-gradient(160deg,#f5f5f4,#e7e5e4)]" />
        )}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent">
          <div className="mx-auto w-full max-w-6xl px-4 pb-10 text-white">
            <h1 className="font-heading max-w-lg text-4xl leading-tight font-semibold sm:text-5xl">{title}</h1>
            <p className="mt-2 max-w-md text-white/90">{sub}</p>
            <Link to={link('san-pham')} className="mt-5 inline-block border border-white px-7 py-2.5 text-sm font-semibold tracking-[0.2em] uppercase hover:bg-white hover:text-black">Mua sắm ngay</Link>
          </div>
        </div>
      </section>
    )
  }

  if (id === 'cafe') {
    return (
      <section className="relative overflow-hidden">
        {banner && <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className={`relative px-4 py-16 text-center ${banner ? 'bg-[#3b2416]/70 text-[#fdf6ec]' : ''}`}>
          <p className="text-sm tracking-[0.3em] uppercase opacity-80">☕ {store.openHours || 'Mở cửa mỗi ngày'}</p>
          <h1 className="font-heading mx-auto mt-2 max-w-xl text-4xl leading-tight font-bold italic sm:text-5xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-md opacity-90">{sub}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to={link('san-pham')} className="s-btn rounded-full px-6">Xem menu</Link>
          </div>
        </div>
      </section>
    )
  }

  if (id === 'tap-hoa') return <QuickSearchHero title={title} sub={sub} />

  return (
    <section className="relative">
      {banner ? (
        <img src={banner} alt="" className="h-72 w-full object-cover sm:h-96" />
      ) : (
        <div className="h-56 w-full bg-[radial-gradient(circle_at_30%_30%,#fde68a,#f97316)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-6 text-white">
        <h1 className="font-heading text-4xl leading-tight font-extrabold drop-shadow sm:text-5xl">{title}</h1>
        <p className="mt-1 max-w-md text-white/90">{sub}</p>
        <Link to={link('san-pham')} className="s-btn mt-4 rounded-full px-6 py-3 text-base">🍽️ Đặt món ngay</Link>
      </div>
    </section>
  )
}

function QuickSearchHero({ title, sub }: { title: string; sub: string }) {
  const { link } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    nav(`${link('san-pham')}?q=${encodeURIComponent(q)}`)
  }
  return (
    <section className="bg-sp px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="text-sm text-white/85">{sub}</p>
        <form onSubmit={submit} className="mt-3 flex overflow-hidden rounded-s bg-white">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm nhanh: gạo, sữa, nước mắm..." className="min-w-0 flex-1 px-3 py-3 text-slate-900 outline-none" aria-label="Tìm sản phẩm" />
          <button className="bg-sa px-4 font-bold">Tìm</button>
        </form>
      </div>
    </section>
  )
}

function Categories() {
  const { template, products, link } = useStore()
  const cats = template.categories.filter((c) => products.some((p) => p.category === c))
  const extra = [...new Set(products.map((p) => p.category))].filter((c) => c && !template.categories.includes(c))
  const all = [...cats, ...extra]
  if (!all.length) return null
  const id = template.id
  if (id === 'tap-hoa') {
    return (
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {all.map((c) => (
          <Link key={c} to={`${link('san-pham')}?cat=${encodeURIComponent(c)}`} className="flex flex-col items-center gap-1 rounded-s border border-sborder bg-ssurf p-2 text-center text-[11px] leading-tight font-medium hover:border-sp">
            <span className="text-2xl">{template.categoryIcons[c] || '🛒'}</span>
            {c}
          </Link>
        ))}
      </div>
    )
  }
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {all.map((c, i) => (
        <Link
          key={c}
          to={`${link('san-pham')}?cat=${encodeURIComponent(c)}`}
          className={`flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm font-semibold whitespace-nowrap ${
            id === 'do-choi'
              ? 'rounded-full text-white shadow'
              : id === 'quan-ao'
                ? 'border-b-2 border-transparent tracking-wide uppercase hover:border-stext'
                : id === 'xe-may'
                  ? 'font-heading rounded-s border border-sborder bg-ssurf uppercase hover:border-sp'
                  : 'rounded-full border border-sborder bg-ssurf hover:border-sp'
          }`}
          style={id === 'do-choi' ? { background: TOY_COLORS[i % TOY_COLORS.length] } : undefined}
        >
          {id !== 'quan-ao' && <span>{template.categoryIcons[c] || template.icon}</span>}
          {c}
        </Link>
      ))}
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  const { template } = useStore()
  const id = template.id
  return (
    <h2
      className={`font-heading mb-4 text-2xl font-bold ${id === 'xe-may' ? 'border-l-4 border-sp pl-3 uppercase' : id === 'quan-ao' ? 'text-center font-semibold tracking-wide' : id === 'cafe' ? 'text-center italic' : ''}`}
    >
      {children}
    </h2>
  )
}

export default function Home() {
  const { template, products, link } = useStore()
  const grouped = template.id === 'cafe' || template.id === 'do-an'
  const cats = [...new Set(products.map((p) => p.category))]
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-6">
        <Categories />
        {grouped ? (
          cats.map((c) => (
            <section key={c} id={`cat-${c}`}>
              <SectionTitle>{c || 'Khác'}</SectionTitle>
              <ProductGrid products={products.filter((p) => p.category === c)} />
            </section>
          ))
        ) : (
          <section>
            <SectionTitle>{template.id === 'quan-ao' ? 'Hàng mới về' : template.id === 'xe-may' ? 'Xe nổi bật' : `${template.productWord[0].toUpperCase()}${template.productWord.slice(1)} nổi bật`}</SectionTitle>
            <ProductGrid products={products.slice(0, 12)} />
            {products.length > 12 && (
              <div className="mt-6 text-center">
                <Link to={link('san-pham')} className="s-btn-outline">Xem tất cả {products.length} {template.productWord}</Link>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  )
}
