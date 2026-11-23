import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { firebaseConfigured } from '../lib/firebase'
import { Spinner } from '../components/ui'
import type { Product, Review, Store, TemplateId } from '../lib/types'
import type { StoreLookup } from '../lib/db'
import { getTemplate, isTemplateId } from '../templates'
import { sampleProducts } from '../templates/samples'
import type { StoreApi } from './StoreContext'
import { StoreMessage } from './StoreMessage'

const NOW = Date.now()

const StorefrontApp = lazy(() => import('./StorefrontApp'))

interface Loaded {
  store: Store
  products: Product[]
  reviews: Review[]
  api: StoreApi
}

async function loadLive(lookup: () => Promise<StoreLookup>): Promise<Loaded | 'notfound' | 'paused'> {
  const db = await import('../lib/db')
  const res = await lookup()
  if (res.status !== 'ok') return res.status
  const store = res.store
  const [products, reviews] = await Promise.all([db.listProducts(store.id), db.listReviews(store.id).catch(() => [] as Review[])])
  const api: StoreApi = {
    getCoupon: (code) => db.getCoupon(store.id, code),
    placeOrder: (o) => db.placeOrder(store.id, o),
    addReview: (r) => db.addReview(store.id, r),
    getMedia: (pid) => db.getProductMedia(store.id, pid),
  }
  return { store, products, reviews, api }
}

function LiveStore({ lookupKey, lookup, base }: { lookupKey: string; lookup: () => Promise<StoreLookup>; base: string }) {
  const [state, setState] = useState<{ key: string; data: Loaded | 'notfound' | 'paused' | 'error' } | null>(null)
  useEffect(() => {
    let cancelled = false
    loadLive(lookup).then(
      (data) => !cancelled && setState({ key: lookupKey, data }),
      () => !cancelled && setState({ key: lookupKey, data: 'error' }),
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupKey])
  if (!firebaseConfigured) return <StoreMessage icon="🛠️" title="Hệ thống đang được cấu hình" text="Cửa hàng sẽ hoạt động ngay sau khi nền tảng kết nối cơ sở dữ liệu." />
  if (!state || state.key !== lookupKey) return <Spinner full label="Đang mở cửa hàng..." />
  if (state.data === 'notfound') return <StoreMessage icon="🔎" title="Không tìm thấy cửa hàng" text="Địa chỉ này chưa có cửa hàng nào. Hãy kiểm tra lại đường dẫn." />
  if (state.data === 'paused') return <StoreMessage icon="⏸️" title="Cửa hàng tạm ngưng hoạt động" text="Cửa hàng này đang tạm ngưng. Vui lòng quay lại sau." />
  if (state.data === 'error') return <StoreMessage icon="⚠️" title="Không tải được cửa hàng" text="Vui lòng kiểm tra kết nối mạng và tải lại trang." />
  const d = state.data
  return (
    <Suspense fallback={<Spinner full />}>
      <StorefrontApp store={d.store} products={d.products} reviews={d.reviews} api={d.api} demo={false} base={base} />
    </Suspense>
  )
}

export function SlugStore({ slugOverride }: { slugOverride?: string }) {
  const params = useParams()
  const slug = (slugOverride || params.slug || '').toLowerCase()
  const lookup = useMemo(() => async () => (await import('../lib/db')).getStoreBySlug(slug), [slug])
  return <LiveStore lookupKey={slug} lookup={lookup} base={slugOverride ? '' : `/s/${slug}`} />
}

export function DomainStore({ domain }: { domain: string }) {
  const lookup = useMemo(() => async () => (await import('../lib/db')).getStoreByDomain(domain), [domain])
  return <LiveStore lookupKey={domain} lookup={lookup} base="" />
}

function demoStore(t: TemplateId): Store {
  return {
    id: `demo-${t}`,
    ownerUid: '',
    ownerEmail: '',
    name: `Cửa hàng mẫu – ${t === 'quan-ao' ? 'Thời trang' : getTemplate(t).name}`,
    slug: `mau-${t}`,
    template: t,
    phone: '0900000000',
    zalo: '0900000000',
    address: '123 Đường Mẫu, Quận 1, TP. Hồ Chí Minh',
    description: 'Đây là cửa hàng mẫu để xem trước giao diện. Đơn hàng đặt thử sẽ không được gửi đi.',
    openHours: '7:00 – 22:00',
    shippingFee: 20000,
    freeShipFrom: 500000,
    theme: { primary: '', accent: '', logo: '', banner: '', heroTitle: '', heroSubtitle: '' },
    bank: { bin: '970436', accountNo: '0123456789', accountName: 'CUA HANG MAU' },
    customDomain: '',
    domainStatus: 'none',
    active: true,
  }
}

export function DemoStore() {
  const { templateId = '' } = useParams()
  const t: TemplateId = isTemplateId(templateId) ? templateId : 'quan-ao'
  const data = useMemo(() => {
    const store = demoStore(t)
    const products: Product[] = sampleProducts(t).map((p, i) => ({ ...p, id: `p${i + 1}`, createdAt: NOW - i * 1000 }))
    const reviews: Review[] = [
      { id: 'r1', productId: 'p1', name: 'Minh Anh', rating: 5, comment: 'Hàng đẹp, giao nhanh, shop tư vấn nhiệt tình!', createdAt: NOW - 86400000 },
      { id: 'r2', productId: 'p1', name: 'Quốc Bảo', rating: 4, comment: 'Đúng mô tả, sẽ ủng hộ tiếp.', createdAt: NOW - 2 * 86400000 },
      { id: 'r3', productId: 'p2', name: 'Thu Trang', rating: 5, comment: 'Rất hài lòng.', createdAt: NOW - 3 * 86400000 },
    ]
    const api: StoreApi = {
      getCoupon: async (code) =>
        code.trim().toUpperCase() === 'GIAM10' ? { code: 'GIAM10', type: 'percent', value: 10, minOrder: 0, expiresAt: '', active: true } : null,
      placeOrder: async () => `MAU${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      addReview: async (r) => ({ ...r, id: `r${Math.random().toString(36).slice(2)}`, createdAt: new Date().getTime() }),
      getMedia: async () => [],
    }
    return { store, products, reviews, api }
  }, [t])
  return (
    <Suspense fallback={<Spinner full />}>
      <StorefrontApp key={t} store={data.store} products={data.products} reviews={data.reviews} api={data.api} demo base={`/mau/${t}`} />
    </Suspense>
  )
}
