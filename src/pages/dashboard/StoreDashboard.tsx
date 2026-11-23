import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { PlatformShell } from '../../components/PlatformShell'
import { Alert, Spinner } from '../../components/ui'
import { getStore, listProducts } from '../../lib/db'
import type { Product, Store } from '../../lib/types'
import { pathStoreLabel, pathStoreUrl } from '../../lib/urls'
import { getTemplate } from '../../templates'
import { DashContext } from './DashContext'
import Overview from './Overview'
import ProductsTab from './ProductsTab'
import OrdersTab from './OrdersTab'
import CouponsTab from './CouponsTab'
import ReviewsTab from './ReviewsTab'
import AppearanceTab from './AppearanceTab'
import SettingsTab from './SettingsTab'
import DomainTab from './DomainTab'

const TABS = [
  { to: '', label: 'Tổng quan', icon: '📊' },
  { to: 'san-pham', label: 'Sản phẩm', icon: '📦' },
  { to: 'don-hang', label: 'Đơn hàng', icon: '🧾' },
  { to: 'ma-giam-gia', label: 'Mã giảm giá', icon: '🏷️' },
  { to: 'danh-gia', label: 'Đánh giá', icon: '⭐' },
  { to: 'giao-dien', label: 'Giao diện', icon: '🎨' },
  { to: 'cai-dat', label: 'Cài đặt', icon: '⚙️' },
  { to: 'ten-mien', label: 'Tên miền', icon: '🌐' },
]

export default function StoreDashboard() {
  const { storeId = '' } = useParams()
  const { user } = useAuth()
  const [sp] = useSearchParams()
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [err, setErr] = useState('')

  const reloadProducts = useCallback(async () => {
    setProducts(await listProducts(storeId))
  }, [storeId])

  useEffect(() => {
    let cancelled = false
    Promise.all([getStore(storeId), listProducts(storeId)]).then(
      ([s, ps]) => {
        if (cancelled) return
        if (!s) setErr('Không tìm thấy cửa hàng.')
        else {
          setStore(s)
          setProducts(ps)
        }
      },
      (e) => !cancelled && setErr((e as { code?: string }).code === 'permission-denied' ? 'Bạn không có quyền quản lý cửa hàng này.' : (e as Error).message),
    )
    return () => {
      cancelled = true
    }
  }, [storeId])

  if (err)
    return (
      <PlatformShell>
        <div className="mx-auto max-w-xl space-y-3 p-4">
          <Alert>{err}</Alert>
          <Link to="/quan-ly" className="btn-ghost">← Cửa hàng của tôi</Link>
        </div>
      </PlatformShell>
    )
  if (!store) return <PlatformShell><Spinner full /></PlatformShell>
  if (user && store.ownerUid !== user.uid)
    return (
      <PlatformShell>
        <div className="mx-auto max-w-xl p-4"><Alert>Bạn không có quyền quản lý cửa hàng này.</Alert></div>
      </PlatformShell>
    )

  const t = getTemplate(store.template)
  return (
    <DashContext.Provider value={{ store, setStore, products, reloadProducts }}>
      <PlatformShell wide>
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl">{t.icon}</span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-extrabold" data-testid="dash-store-name">{store.name}</h1>
              <a href={pathStoreUrl(store.slug)} target="_blank" rel="noreferrer" className="block truncate text-sm text-indigo-600 hover:underline">
                {pathStoreLabel(store.slug)}
              </a>
            </div>
            <a href={pathStoreUrl(store.slug)} target="_blank" rel="noreferrer" className="btn-ghost">Xem cửa hàng ↗</a>
          </div>
          {!store.active && <div className="mt-3"><Alert kind="warn">Cửa hàng đang bị quản trị viên tạm khoá – khách không thể truy cập.</Alert></div>}
          {sp.get('moi') && (
            <div className="mt-3">
              <Alert kind="success">
                🎉 Cửa hàng đã được tạo và đang hoạt động tại <b>{store.slug}</b>. Hãy thêm sản phẩm, tài khoản ngân hàng (cho VietQR) và logo.
              </Alert>
            </div>
          )}
          <nav className="no-scrollbar -mx-4 mt-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4" aria-label="Quản trị cửa hàng">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to ? `/quan-ly/${store.id}/${tab.to}` : `/quan-ly/${store.id}`}
                end
                className={({ isActive }) =>
                  `shrink-0 border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap ${isActive ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`
                }
              >
                {tab.icon} {tab.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-5">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="san-pham" element={<ProductsTab />} />
              <Route path="don-hang" element={<OrdersTab />} />
              <Route path="ma-giam-gia" element={<CouponsTab />} />
              <Route path="danh-gia" element={<ReviewsTab />} />
              <Route path="giao-dien" element={<AppearanceTab />} />
              <Route path="cai-dat" element={<SettingsTab />} />
              <Route path="ten-mien" element={<DomainTab />} />
            </Routes>
          </div>
        </div>
      </PlatformShell>
    </DashContext.Provider>
  )
}
