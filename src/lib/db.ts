import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  runTransaction,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { getDb } from './firebase'
import { getTemplate, resolveTemplateId, storedTemplateId } from '../templates'
import { sampleProducts } from '../templates/samples'
import type { Coupon, DomainStatus, Order, OrderStatus, PaymentConfig, Plan, PlansConfig, PlatformSettings, Product, Review, Store, StoreTheme, TemplateId, UserAccount, VipOrder, VipOrderStatus, VipTerm } from './types'
import { computeDiscount, todayISO } from './coupon'
import { makeVipOrderCode, nextVipExpiry, termPrice, VIP_TERMS } from './plans'

function ms(v: unknown): number | undefined {
  return v instanceof Timestamp ? v.toMillis() : undefined
}

function toStore(id: string, d: DocumentData): Store {
  const t = getTemplate(resolveTemplateId(d.template, d.theme?.variant))
  return {
    id,
    ownerUid: d.ownerUid,
    ownerEmail: d.ownerEmail || '',
    name: d.name || '',
    slug: d.slug,
    template: t.id,
    phone: d.phone || '',
    zalo: d.zalo || '',
    address: d.address || '',
    description: d.description || '',
    openHours: d.openHours || '',
    shippingFee: d.shippingFee || 0,
    freeShipFrom: d.freeShipFrom || 0,
    theme: { ...defaultTheme(t.id), ...(d.theme || {}), variant: t.id },
    bank: { bin: '', accountNo: '', accountName: '', ...(d.bank || {}) },
    customDomain: d.customDomain || '',
    domainStatus: d.domainStatus || 'none',
    active: d.active === true,
    status: d.status === 'closed' ? 'closed' : 'open',
    closedReason: d.closedReason || '',
    closedAt: ms(d.closedAt),
    closedBy: d.closedBy || '',
    mapLocation: d.mapLocation || '',
    productCount: typeof d.productCount === 'number' ? d.productCount : undefined,
    createdAt: ms(d.createdAt),
  }
}

export function defaultTheme(template: TemplateId): StoreTheme {
  const t = getTemplate(template)
  return { primary: t.palette.primary, accent: t.palette.accent, logo: '', banner: '', heroTitle: t.heroTitle, heroSubtitle: t.heroSubtitle, variant: t.id }
}

function toProduct(id: string, d: DocumentData): Product {
  return {
    id,
    name: d.name || '',
    price: d.price || 0,
    oldPrice: d.oldPrice || 0,
    stock: d.stock ?? 0,
    description: d.description || '',
    category: d.category || '',
    images: d.images || [],
    thumb: d.thumb || '',
    uploadCount: d.uploadCount || 0,
    specs: d.specs || {},
    sizes: d.sizes || [],
    active: d.active !== false,
    createdAt: ms(d.createdAt),
  }
}

function toOrder(id: string, d: DocumentData): Order {
  return {
    id,
    items: d.items || [],
    customer: { name: '', phone: '', address: '', note: '', ...(d.customer || {}) },
    mode: d.mode || '',
    booking: d.booking || '',
    payment: d.payment || 'cod',
    subtotal: d.subtotal || 0,
    shipping: d.shipping || 0,
    discount: d.discount || 0,
    couponCode: d.couponCode || '',
    total: d.total || 0,
    status: d.status || 'new',
    stockApplied: d.stockApplied === true,
    createdAt: ms(d.createdAt),
  }
}

function toReview(id: string, d: DocumentData): Review {
  return { id, productId: d.productId, name: d.name || '', rating: d.rating || 0, comment: d.comment || '', createdAt: ms(d.createdAt) }
}

// ---------------- Stores ----------------

export async function isSlugTaken(slug: string): Promise<boolean> {
  const snap = await getDoc(doc(getDb(), 'slugs', slug))
  return snap.exists()
}

export interface NewStoreInput {
  name: string
  slug: string
  template: TemplateId
  phone: string
  zalo: string
  address: string
}

/** maxSamples: số sản phẩm mẫu tối đa theo giới hạn gói (undefined = không giới hạn). */
export async function createStore(user: User, input: NewStoreInput, withSamples: boolean, maxSamples?: number): Promise<string> {
  const db = getDb()
  const storeRef = doc(collection(db, 'stores'))
  const batch = writeBatch(db)
  batch.set(storeRef, {
    ownerUid: user.uid,
    ownerEmail: user.email || '',
    name: input.name.trim(),
    slug: input.slug,
    template: storedTemplateId(input.template),
    phone: input.phone.trim(),
    zalo: input.zalo.trim(),
    address: input.address.trim(),
    description: '',
    openHours: '',
    shippingFee: 0,
    freeShipFrom: 0,
    theme: defaultTheme(input.template),
    bank: { bin: '', accountNo: '', accountName: '' },
    customDomain: '',
    domainStatus: 'none',
    active: true,
    status: 'open',
    closedReason: '',
    closedAt: null,
    closedBy: '',
    mapLocation: '',
    productCount: 0,
    lastProductId: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(doc(db, 'slugs', input.slug), { storeId: storeRef.id, ownerUid: user.uid })
  await batch.commit()
  if (withSamples) {
    const samples = sampleProducts(input.template).slice(0, maxSamples === undefined || maxSamples === 0 ? undefined : maxSamples)
    let count = 0
    for (const p of samples) {
      const ref = doc(collection(db, 'stores', storeRef.id, 'products'))
      const b2 = writeBatch(db)
      b2.set(ref, { ...p, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      b2.update(storeRef, { productCount: ++count, lastProductId: ref.id })
      await b2.commit()
    }
  }
  return storeRef.id
}

export async function listMyStores(uid: string): Promise<Store[]> {
  const snap = await getDocs(query(collection(getDb(), 'stores'), where('ownerUid', '==', uid)))
  return snap.docs.map((d) => toStore(d.id, d.data())).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

export async function getStore(id: string): Promise<Store | null> {
  const snap = await getDoc(doc(getDb(), 'stores', id))
  return snap.exists() ? toStore(snap.id, snap.data()) : null
}

export type StoreLookup = { status: 'ok'; store: Store } | { status: 'notfound' } | { status: 'paused' }

async function lookupStoreId(storeId: string): Promise<StoreLookup> {
  try {
    const store = await getStore(storeId)
    return store ? { status: 'ok', store } : { status: 'notfound' }
  } catch (e) {
    if ((e as { code?: string }).code === 'permission-denied') return { status: 'paused' }
    throw e
  }
}

export async function getStoreBySlug(slug: string): Promise<StoreLookup> {
  const s = await getDoc(doc(getDb(), 'slugs', slug))
  if (!s.exists()) return { status: 'notfound' }
  return lookupStoreId(s.data().storeId)
}

export async function getStoreByDomain(domain: string): Promise<StoreLookup> {
  for (const d of [domain, `www.${domain}`]) {
    const s = await getDoc(doc(getDb(), 'domains', d))
    if (s.exists()) return lookupStoreId(s.data().storeId)
  }
  return { status: 'notfound' }
}

export type StorePatch = Partial<Omit<Store, 'id' | 'ownerUid' | 'ownerEmail' | 'slug' | 'active' | 'createdAt' | 'status' | 'closedReason' | 'closedAt' | 'closedBy'>>

export async function updateStore(id: string, patch: StorePatch): Promise<void> {
  await updateDoc(doc(getDb(), 'stores', id), { ...patch, updatedAt: serverTimestamp() })
}

/** Đóng/mở cửa hàng (chủ shop hoặc admin nền tảng); dữ liệu giữ nguyên. */
export async function setStoreOpen(storeId: string, open: boolean, byUid: string, reason = ''): Promise<Pick<Store, 'status' | 'closedReason' | 'closedAt' | 'closedBy'>> {
  await updateDoc(doc(getDb(), 'stores', storeId), {
    status: open ? 'open' : 'closed',
    closedReason: open ? '' : reason.trim().slice(0, 200),
    closedAt: open ? null : serverTimestamp(),
    closedBy: open ? '' : byUid,
    updatedAt: serverTimestamp(),
  })
  return open ? { status: 'open', closedReason: '', closedAt: undefined, closedBy: '' } : { status: 'closed', closedReason: reason.trim().slice(0, 200), closedAt: Date.now(), closedBy: byUid }
}

export async function setCustomDomain(store: Store, domain: string): Promise<void> {
  const db = getDb()
  if (domain && domain !== store.customDomain) {
    const existing = await getDoc(doc(db, 'domains', domain))
    if (existing.exists()) throw new Error('Tên miền này đã được một cửa hàng khác sử dụng.')
  }
  const batch = writeBatch(db)
  if (store.customDomain && store.customDomain !== domain) batch.delete(doc(db, 'domains', store.customDomain))
  if (domain && domain !== store.customDomain) batch.set(doc(db, 'domains', domain), { storeId: store.id, ownerUid: store.ownerUid })
  batch.update(doc(db, 'stores', store.id), { customDomain: domain, domainStatus: 'none', updatedAt: serverTimestamp() })
  await batch.commit()
}

export async function setDomainStatus(storeId: string, status: DomainStatus): Promise<void> {
  await updateDoc(doc(getDb(), 'stores', storeId), { domainStatus: status, updatedAt: serverTimestamp() })
}

// ---------------- Products ----------------

export async function listProducts(storeId: string): Promise<Product[]> {
  const snap = await getDocs(collection(getDb(), 'stores', storeId, 'products'))
  return snap.docs.map((d) => toProduct(d.id, d.data())).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getProductMedia(storeId: string, productId: string): Promise<string[]> {
  const snap = await getDoc(doc(getDb(), 'stores', storeId, 'productMedia', productId))
  return snap.exists() ? (snap.data().images as string[]) || [] : []
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'uploadCount'>

/** currentCount: bộ đếm sản phẩm hiện tại của cửa hàng (tăng 1 khi thêm mới). */
export async function saveProduct(storeId: string, productId: string | null, data: ProductInput, uploads: string[], currentCount = 0): Promise<string> {
  const db = getDb()
  const ref = productId ? doc(db, 'stores', storeId, 'products', productId) : doc(collection(db, 'stores', storeId, 'products'))
  const batch = writeBatch(db)
  const payload = { ...data, uploadCount: uploads.length, updatedAt: serverTimestamp() }
  if (productId) batch.update(ref, payload)
  else {
    batch.set(ref, { ...payload, createdAt: serverTimestamp() })
    batch.update(doc(db, 'stores', storeId), { productCount: currentCount + 1, lastProductId: ref.id, updatedAt: serverTimestamp() })
  }
  const mediaRef = doc(db, 'stores', storeId, 'productMedia', ref.id)
  if (uploads.length) batch.set(mediaRef, { images: uploads })
  else if (productId) batch.delete(mediaRef)
  await batch.commit()
  return ref.id
}

export async function deleteProduct(storeId: string, productId: string, currentCount = 0): Promise<void> {
  const db = getDb()
  const batch = writeBatch(db)
  batch.delete(doc(db, 'stores', storeId, 'products', productId))
  batch.delete(doc(db, 'stores', storeId, 'productMedia', productId))
  if (currentCount > 0) batch.update(doc(db, 'stores', storeId), { productCount: currentCount - 1, lastProductId: productId, updatedAt: serverTimestamp() })
  await batch.commit()
}

/** Khởi tạo bộ đếm sản phẩm cho cửa hàng tạo trước v1.1.0. */
export async function initProductCount(storeId: string, count: number): Promise<void> {
  await updateDoc(doc(getDb(), 'stores', storeId), { productCount: count })
}

/** Đổi mẫu giao diện; giữ logo/banner, màu và tiêu đề chưa sửa thì theo mẫu mới. */
export function themeForTemplate(store: Store, id: TemplateId): StoreTheme {
  const oldDef = defaultTheme(store.template)
  const next = defaultTheme(id)
  const keep = <K extends keyof StoreTheme>(k: K) => (store.theme[k] && store.theme[k] !== oldDef[k] ? store.theme[k] : next[k])
  return { ...next, logo: store.theme.logo, banner: store.theme.banner, primary: keep('primary'), accent: keep('accent'), heroTitle: keep('heroTitle'), heroSubtitle: keep('heroSubtitle') }
}

export async function changeStoreTemplate(store: Store, id: TemplateId): Promise<StoreTheme> {
  const theme = themeForTemplate(store, id)
  await updateDoc(doc(getDb(), 'stores', store.id), { template: storedTemplateId(id), theme, updatedAt: serverTimestamp() })
  return theme
}

// ---------------- Orders ----------------

const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function newOrderId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ORDER_ALPHABET[b % ORDER_ALPHABET.length]).join('')
}

export type NewOrder = Omit<Order, 'id' | 'status' | 'stockApplied' | 'createdAt'>

export class CouponError extends Error {
  name = 'CouponError'
}

/** Đặt đơn; nếu có mã giảm giá thì kiểm tra lại mã và tăng usedCount trong cùng một transaction. */
export async function placeOrder(storeId: string, order: NewOrder): Promise<string> {
  const db = getDb()
  const id = newOrderId()
  const ref = doc(db, 'stores', storeId, 'orders', id)
  const data = { ...order, status: 'new', stockApplied: false, createdAt: serverTimestamp() }
  if (!order.couponCode) {
    await setDoc(ref, data)
    return id
  }
  const cRef = doc(db, 'stores', storeId, 'coupons', order.couponCode)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(cRef)
    const c = snap.exists() ? toCoupon(snap.data()) : null
    const r = computeDiscount(order.subtotal, c, todayISO())
    if (r.error || !c) throw new CouponError(r.error || 'Mã giảm giá không tồn tại.')
    if (r.discount !== order.discount) throw new CouponError('Mã giảm giá vừa thay đổi, vui lòng áp dụng lại mã.')
    tx.set(ref, data)
    tx.update(cRef, { usedCount: c.usedCount + 1, lastOrderId: id })
  })
  return id
}

export function subscribeOrders(storeId: string, cb: (orders: Order[]) => void, onError: (e: Error) => void): () => void {
  const q = query(collection(getDb(), 'stores', storeId, 'orders'), orderBy('createdAt', 'desc'), limit(300))
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => toOrder(d.id, d.data()))), onError)
}

/** Updates order status; stock is deducted when an order starts shipping and restored if it is cancelled. */
export async function updateOrderStatus(storeId: string, order: Order, status: OrderStatus, products: Product[]): Promise<void> {
  const db = getDb()
  const batch = writeBatch(db)
  const shouldApply = status === 'shipping' || status === 'done'
  let stockApplied = order.stockApplied
  if (shouldApply !== order.stockApplied) {
    const sign = shouldApply ? -1 : 1
    const qtyById = new Map<string, number>()
    for (const it of order.items) qtyById.set(it.productId, (qtyById.get(it.productId) || 0) + it.qty)
    for (const [pid, qty] of qtyById) {
      const p = products.find((x) => x.id === pid)
      if (!p) continue
      batch.update(doc(db, 'stores', storeId, 'products', pid), { stock: Math.max(0, p.stock + sign * qty), updatedAt: serverTimestamp() })
    }
    stockApplied = shouldApply
  }
  batch.update(doc(db, 'stores', storeId, 'orders', order.id), { status, stockApplied, updatedAt: serverTimestamp() })
  await batch.commit()
}

// ---------------- Coupons ----------------

function toCoupon(d: DocumentData): Coupon {
  return {
    code: d.code,
    type: d.type === 'fixed' ? 'fixed' : 'percent',
    value: d.value || 0,
    minOrder: d.minOrder || 0,
    expiresAt: d.expiresAt || '',
    active: d.active === true,
    maxUses: d.maxUses || 0,
    usedCount: d.usedCount || 0,
  }
}

export async function listCoupons(storeId: string): Promise<Coupon[]> {
  const snap = await getDocs(collection(getDb(), 'stores', storeId, 'coupons'))
  return snap.docs.map((d) => toCoupon(d.data())).sort((a, b) => a.code.localeCompare(b.code))
}

export async function getCoupon(storeId: string, code: string): Promise<Coupon | null> {
  const clean = code.trim().toUpperCase()
  if (!/^[A-Z0-9]{3,20}$/.test(clean)) return null
  const snap = await getDoc(doc(getDb(), 'stores', storeId, 'coupons', clean))
  return snap.exists() ? toCoupon(snap.data()) : null
}

export type CouponInput = Omit<Coupon, 'usedCount'>

export async function createCoupon(storeId: string, c: CouponInput): Promise<void> {
  const ref = doc(getDb(), 'stores', storeId, 'coupons', c.code)
  if ((await getDoc(ref)).exists()) throw new Error(`Mã ${c.code} đã có trong cửa hàng. Hãy dùng mã khác hoặc sửa mã cũ.`)
  await setDoc(ref, { ...c, usedCount: 0, updatedAt: serverTimestamp() })
}

/** Sửa mã (không đổi code và số lượt đã dùng). */
export async function updateCoupon(storeId: string, code: string, patch: Partial<Omit<CouponInput, 'code'>>): Promise<void> {
  await updateDoc(doc(getDb(), 'stores', storeId, 'coupons', code), { ...patch, updatedAt: serverTimestamp() })
}

export async function deleteCoupon(storeId: string, code: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'stores', storeId, 'coupons', code))
}

// ---------------- Reviews ----------------

export async function listReviews(storeId: string): Promise<Review[]> {
  const snap = await getDocs(query(collection(getDb(), 'stores', storeId, 'reviews'), orderBy('createdAt', 'desc'), limit(500)))
  return snap.docs.map((d) => toReview(d.id, d.data()))
}

export async function addReview(storeId: string, r: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  const ref = doc(collection(getDb(), 'stores', storeId, 'reviews'))
  await setDoc(ref, { ...r, createdAt: serverTimestamp() })
  return { ...r, id: ref.id, createdAt: Date.now() }
}

export async function deleteReview(storeId: string, id: string): Promise<void> {
  await deleteDoc(doc(getDb(), 'stores', storeId, 'reviews', id))
}

// ---------------- Platform ----------------

export async function getDisabledTemplates(): Promise<string[]> {
  try {
    const snap = await getDoc(doc(getDb(), 'platform', 'templates'))
    return snap.exists() ? (snap.data().disabled as string[]) || [] : []
  } catch {
    return []
  }
}

export async function setDisabledTemplates(disabled: string[]): Promise<void> {
  await setDoc(doc(getDb(), 'platform', 'templates'), { disabled, updatedAt: serverTimestamp() })
}

export async function listAllStores(): Promise<Store[]> {
  const snap = await getDocs(collection(getDb(), 'stores'))
  return snap.docs.map((d) => toStore(d.id, d.data())).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function setStoreActive(storeId: string, active: boolean): Promise<void> {
  await updateDoc(doc(getDb(), 'stores', storeId), { active, updatedAt: serverTimestamp() })
}

export async function countOrders(storeId: string, since?: Date): Promise<number> {
  const col = collection(getDb(), 'stores', storeId, 'orders')
  const q = since ? query(col, where('createdAt', '>=', Timestamp.fromDate(since))) : col
  const snap = await getCountFromServer(q)
  return snap.data().count
}

// ---------------- Gói tài khoản ----------------

function toAccount(uid: string, d: DocumentData): UserAccount {
  return { uid, email: d.email || '', plan: d.plan === 'vip' ? 'vip' : 'free', vipExpiresAt: ms(d.vipExpiresAt), createdAt: ms(d.createdAt) }
}

/** Đọc hồ sơ gói của người dùng; tạo hồ sơ gói Thường nếu chưa có. */
export async function ensureUserAccount(user: User): Promise<UserAccount> {
  const ref = doc(getDb(), 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return toAccount(user.uid, snap.data())
  await setDoc(ref, { email: user.email || '', plan: 'free', vipExpiresAt: null, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  const created = await getDoc(ref)
  return toAccount(user.uid, created.data() || {})
}

export async function listUserAccounts(): Promise<UserAccount[]> {
  const snap = await getDocs(collection(getDb(), 'users'))
  return snap.docs.map((d) => toAccount(d.id, d.data()))
}

/** Chỉ admin: đặt gói cho tài khoản (tạo hồ sơ nếu tài khoản cũ chưa có). */
export async function setUserPlan(acc: { uid: string; email: string; createdAt?: number }, plan: Plan, vipExpiresAt: Date | null): Promise<void> {
  await setDoc(doc(getDb(), 'users', acc.uid), {
    email: acc.email,
    plan,
    vipExpiresAt: plan === 'vip' && vipExpiresAt ? Timestamp.fromDate(vipExpiresAt) : null,
    createdAt: acc.createdAt ? Timestamp.fromMillis(acc.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getPlansConfig(): Promise<PlansConfig | null> {
  const snap = await getDoc(doc(getDb(), 'platformConfig', 'plans'))
  if (!snap.exists()) return null
  const d = snap.data()
  return { free: { maxTemplates: d.free.maxTemplates, maxProducts: d.free.maxProducts }, vip: { maxTemplates: d.vip.maxTemplates, maxProducts: d.vip.maxProducts } }
}

export async function savePlansConfig(c: PlansConfig): Promise<void> {
  await setDoc(doc(getDb(), 'platformConfig', 'plans'), { free: c.free, vip: c.vip, updatedAt: serverTimestamp() })
}

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const snap = await getDoc(doc(getDb(), 'platformConfig', 'settings'))
  if (!snap.exists()) return null
  return { freeMode: snap.data().freeMode !== false, freeClosedAt: ms(snap.data().freeClosedAt) }
}

export async function setFreeMode(on: boolean): Promise<void> {
  await setDoc(doc(getDb(), 'platformConfig', 'settings'), { freeMode: on, freeClosedAt: on ? null : serverTimestamp(), updatedAt: serverTimestamp() })
}

// ---------------- Nâng cấp VIP qua chuyển khoản ----------------

export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  const snap = await getDoc(doc(getDb(), 'platformConfig', 'payment'))
  return snap.exists() ? toPaymentConfig(snap.data()) : null
}

/** Theo dõi cài đặt nhận tiền để QR/giá đổi ngay khi admin sửa. */
export function watchPaymentConfig(cb: (c: PaymentConfig | null) => void, onError: (e: Error) => void): () => void {
  return onSnapshot(
    doc(getDb(), 'platformConfig', 'payment'),
    (snap) => cb(snap.exists() ? toPaymentConfig(snap.data()) : null),
    onError,
  )
}

function toPaymentConfig(d: DocumentData): PaymentConfig {
  const prices: PaymentConfig['prices'] = {}
  for (const { term } of VIP_TERMS) if (typeof d.prices?.[term] === 'number') prices[term] = d.prices[term]
  return { bank: { bin: d.bank?.bin || '', accountNo: d.bank?.accountNo || '', accountName: d.bank?.accountName || '' }, prices }
}

export async function savePaymentConfig(c: PaymentConfig): Promise<void> {
  const prices: Record<string, number> = {}
  for (const { term } of VIP_TERMS) if (c.prices[term]) prices[term] = c.prices[term] as number
  await setDoc(doc(getDb(), 'platformConfig', 'payment'), { bank: c.bank, prices, updatedAt: serverTimestamp() })
}

function toVipOrder(id: string, d: DocumentData): VipOrder {
  return {
    id,
    uid: d.uid,
    email: d.email || '',
    term: d.term,
    months: d.months,
    amount: d.amount,
    bank: { bin: d.bank?.bin || '', accountNo: d.bank?.accountNo || '', accountName: d.bank?.accountName || '' },
    status: d.status as VipOrderStatus,
    proof: d.proof || '',
    createdAt: ms(d.createdAt),
    submittedAt: ms(d.submittedAt),
    decidedAt: ms(d.decidedAt),
    vipExpiresAt: ms(d.vipExpiresAt),
    rejectReason: d.rejectReason || '',
  }
}

const byNewest = (a: VipOrder, b: VipOrder) => (b.createdAt || 0) - (a.createdAt || 0)

/** Tạo đơn nâng VIP; số tiền và tài khoản nhận lấy từ cài đặt hiện tại (rules kiểm tra khớp). */
export async function createVipOrder(user: User, cfg: PaymentConfig, term: VipTerm): Promise<string> {
  const months = VIP_TERMS.find((t) => t.term === term)?.months
  const amount = termPrice(cfg, term)
  if (!months || !amount) throw new Error('Mốc thời hạn này chưa mở bán.')
  for (let attempt = 0; ; attempt++) {
    const id = makeVipOrderCode(user.uid)
    try {
      await setDoc(doc(getDb(), 'vipOrders', id), {
        uid: user.uid,
        email: user.email || '',
        term,
        months,
        amount,
        bank: cfg.bank,
        status: 'pending',
        proof: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return id
    } catch (e) {
      if (attempt >= 2) throw e
    }
  }
}

/** Theo dõi đơn nâng VIP của chính mình (cập nhật ngay khi quản trị xác nhận). */
export function watchMyVipOrders(uid: string, cb: (orders: VipOrder[]) => void, onError: (e: Error) => void): () => void {
  return onSnapshot(
    query(collection(getDb(), 'vipOrders'), where('uid', '==', uid)),
    (snap) => cb(snap.docs.map((d) => toVipOrder(d.id, d.data())).sort(byNewest)),
    onError,
  )
}

export async function submitVipProof(orderId: string, proof: string): Promise<void> {
  await updateDoc(doc(getDb(), 'vipOrders', orderId), { status: 'submitted', proof, submittedAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function cancelVipOrder(orderId: string): Promise<void> {
  await updateDoc(doc(getDb(), 'vipOrders', orderId), { status: 'cancelled', updatedAt: serverTimestamp() })
}

/** Chỉ admin. */
export async function listVipOrders(): Promise<VipOrder[]> {
  const snap = await getDocs(query(collection(getDb(), 'vipOrders'), orderBy('createdAt', 'desc'), limit(300)))
  return snap.docs.map((d) => toVipOrder(d.id, d.data()))
}

/** Chỉ admin: xác nhận đã nhận tiền → kích hoạt/gia hạn VIP và chốt đơn trong cùng một lần ghi. */
export async function approveVipOrder(o: VipOrder): Promise<Date> {
  const db = getDb()
  const userRef = doc(db, 'users', o.uid)
  const snap = await getDoc(userRef)
  const acc = snap.exists() ? toAccount(o.uid, snap.data()) : null
  const expires = Timestamp.fromDate(nextVipExpiry(acc, o.months))
  const b = writeBatch(db)
  b.set(userRef, {
    email: acc?.email || o.email,
    plan: 'vip',
    vipExpiresAt: expires,
    createdAt: acc?.createdAt ? Timestamp.fromMillis(acc.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  b.update(doc(db, 'vipOrders', o.id), { status: 'approved', decidedAt: serverTimestamp(), vipExpiresAt: expires, updatedAt: serverTimestamp() })
  await b.commit()
  return expires.toDate()
}

/** Chỉ admin. */
export async function rejectVipOrder(orderId: string, reason: string): Promise<void> {
  await updateDoc(doc(getDb(), 'vipOrders', orderId), { status: 'rejected', rejectReason: reason, decidedAt: serverTimestamp(), updatedAt: serverTimestamp() })
}
