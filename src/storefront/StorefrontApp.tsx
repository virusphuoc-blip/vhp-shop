import { useEffect, type CSSProperties } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import type { Product, Review, Store } from '../lib/types'
import { getTemplate } from '../templates'
import { COPYRIGHT, VERSION } from '../version'
import { zaloLink } from '../lib/zalo'
import { applySeo } from '../lib/seo'
import { StoreProvider, useStore, type StoreApi } from './StoreContext'
import Home from './Home'
import ProductList from './ProductList'
import ProductDetail from './ProductDetail'
import CartPage from './CartPage'
import Checkout from './Checkout'
import OrderDone from './OrderDone'

function themeVars(store: Store): CSSProperties {
  const t = getTemplate(store.template)
  return {
    '--sp': store.theme.primary || t.palette.primary,
    '--sa': store.theme.accent || t.palette.accent,
    '--sbg': t.palette.bg,
    '--ssurf': t.palette.surface,
    '--stext': t.palette.text,
    '--smuted': t.palette.muted,
    '--sborder': t.palette.border,
    '--sradius': t.radius,
    '--sheading': t.headingFont,
    fontFamily: t.bodyFont,
    colorScheme: t.dark ? 'dark' : 'light',
  } as CSSProperties
}

function StoreHeader() {
  const { store, template, link, cartCount, demo } = useStore()
  const logo = store.theme.logo
  return (
    <>
      {demo && (
        <div className="bg-amber-400 px-3 py-1.5 text-center text-xs font-semibold text-amber-950">
          Đây là cửa hàng mẫu – <Link to={`/dang-ky?mau=${store.template}`} className="underline">tạo cửa hàng của bạn với mẫu này</Link>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-sborder bg-ssurf/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link to={link()} className="flex min-w-0 flex-1 items-center gap-2">
            {logo ? (
              <img src={logo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sp text-lg">{template.icon}</span>
            )}
            <span className="font-heading truncate text-lg font-bold text-stext">{store.name}</span>
          </Link>
          <Link to={link('san-pham')} className="rounded-full p-2 text-stext hover:bg-sbg" aria-label="Tìm kiếm sản phẩm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </Link>
          <Link to={link('gio-hang')} className="relative rounded-full p-2 text-stext hover:bg-sbg" aria-label={`Giỏ hàng (${cartCount})`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /><circle cx="10" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></svg>
            {cartCount > 0 && (
              <span data-testid="cart-count" className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sa px-1 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>
    </>
  )
}

function StoreFooter() {
  const { store, link } = useStore()
  return (
    <footer className="mt-12 border-t border-sborder bg-ssurf px-4 py-8 text-sm text-smuted">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
        <div>
          <div className="font-heading text-base font-bold text-stext">{store.name}</div>
          {store.description && <p className="mt-1">{store.description}</p>}
        </div>
        <div className="space-y-1">
          {store.address && <p>📍 {store.address}</p>}
          {store.phone && <p>📞 <a href={`tel:${store.phone}`} className="hover:text-sp">{store.phone}</a></p>}
          {store.zalo && <p>💬 <a href={zaloLink(store.zalo)} target="_blank" rel="noreferrer" className="hover:text-sp">Zalo: {store.zalo}</a></p>}
          {store.openHours && <p>🕒 {store.openHours}</p>}
        </div>
        <div className="space-y-1">
          <Link to={link('san-pham')} className="block hover:text-sp">Tất cả sản phẩm</Link>
          <Link to={link('gio-hang')} className="block hover:text-sp">Giỏ hàng</Link>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-6xl border-t border-sborder pt-4 text-center text-xs">
        <p>{COPYRIGHT}</p>
        <p className="mt-1">Website tạo bởi VHP Shop v{VERSION}</p>
      </div>
    </footer>
  )
}

function FloatingZalo() {
  const { store } = useStore()
  if (!store.zalo) return null
  return (
    <a
      href={zaloLink(store.zalo)}
      target="_blank"
      rel="noreferrer"
      className="fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#0068ff] text-xs font-extrabold text-white shadow-lg"
      aria-label="Chat Zalo với cửa hàng"
    >
      Zalo
    </a>
  )
}

function StoreNotFound() {
  const { link } = useStore()
  return (
    <div className="px-4 py-20 text-center">
      <div className="text-5xl">🔎</div>
      <h1 className="font-heading mt-3 text-2xl font-bold">Không tìm thấy trang</h1>
      <Link to={link()} className="s-btn mt-6">Về trang chủ cửa hàng</Link>
    </div>
  )
}

function Seo() {
  const { store, template } = useStore()
  useEffect(() => {
    applySeo({
      title: `${store.name} – ${template.name}`,
      description: store.description || `${store.name}: ${store.theme.heroSubtitle || template.heroSubtitle} Đặt hàng online, thanh toán COD, chuyển khoản VietQR hoặc qua Zalo.`,
      image: store.theme.banner,
    })
  }, [store, template])
  return null
}

export default function StorefrontApp(props: { store: Store; products: Product[]; reviews: Review[]; api: StoreApi; demo: boolean; base: string }) {
  return (
    <StoreProvider {...props}>
      <div style={themeVars(props.store)} className="flex min-h-screen flex-col bg-sbg text-stext">
        <Seo />
        <StoreHeader />
        <main className="flex-1">
          <Routes>
            <Route index element={<Home />} />
            <Route path="san-pham" element={<ProductList />} />
            <Route path="san-pham/:productId" element={<ProductDetail />} />
            <Route path="gio-hang" element={<CartPage />} />
            <Route path="thanh-toan" element={<Checkout />} />
            <Route path="don-hang/:orderId" element={<OrderDone />} />
            <Route path="*" element={<StoreNotFound />} />
          </Routes>
        </main>
        <StoreFooter />
        <FloatingZalo />
      </div>
    </StoreProvider>
  )
}
