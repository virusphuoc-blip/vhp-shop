import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, collection, query, where, serverTimestamp, setDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore'

let env: RulesTestEnvironment

const ADMIN = { email: 'virusphuoc@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } }

function storeData(uid: string, slug: string, extra: Record<string, unknown> = {}) {
  return {
    ownerUid: uid,
    ownerEmail: `${uid}@test.vn`,
    name: 'Shop ' + uid,
    slug,
    template: 'cafe',
    phone: '0912345678',
    zalo: '0912345678',
    address: 'Hà Nội',
    description: '',
    openHours: '',
    shippingFee: 0,
    freeShipFrom: 0,
    theme: { primary: '#000', accent: '#fff', logo: '', banner: '', heroTitle: '', heroSubtitle: '' },
    bank: { bin: '', accountNo: '', accountName: '' },
    customDomain: '',
    domainStatus: 'none',
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...extra,
  }
}

const product = {
  name: 'Cà phê sữa',
  price: 25000,
  oldPrice: 0,
  stock: 10,
  description: '',
  category: 'Cà phê',
  images: [],
  thumb: '',
  uploadCount: 0,
  specs: {},
  sizes: [],
  active: true,
}

function order(extra: Record<string, unknown> = {}) {
  return {
    items: [{ productId: 'p1', name: 'Cà phê', price: 25000, qty: 1, size: '', note: '' }],
    customer: { name: 'An', phone: '0912345678', address: 'HN', note: '' },
    mode: 'delivery',
    booking: '',
    payment: 'cod',
    subtotal: 25000,
    shipping: 0,
    discount: 0,
    couponCode: '',
    total: 25000,
    status: 'new',
    stockApplied: false,
    createdAt: serverTimestamp(),
    ...extra,
  }
}

async function createStoreAs(uid: string, storeId: string, slug: string, extra: Record<string, unknown> = {}) {
  const db = env.authenticatedContext(uid, { email: `${uid}@test.vn` }).firestore()
  const b = writeBatch(db)
  b.set(doc(db, 'stores', storeId), storeData(uid, slug, extra))
  b.set(doc(db, 'slugs', slug), { storeId, ownerUid: uid })
  await b.commit()
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-vhp-shop',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})
afterAll(async () => env.cleanup())
beforeEach(async () => {
  await env.clearFirestore()
  await createStoreAs('alice', 'sA', 'shop-alice')
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'stores/sA/products/p1'), { ...product, createdAt: new Date(), updatedAt: new Date() })
    await setDoc(doc(ctx.firestore(), 'stores/sA/orders/ORD001'), { ...order(), createdAt: new Date() })
    await setDoc(doc(ctx.firestore(), 'stores/sOff'), { ...storeData('carol', 'shop-off'), active: false, createdAt: new Date() })
  })
})

describe('cửa hàng', () => {
  it('chủ shop tạo cửa hàng + slug', async () => {
    await assertSucceeds(createStoreAs('bob', 'sB', 'shop-bob'))
  })
  it('cho phép ngành Điện tử / Nội thất, chặn id mẫu lạ', async () => {
    await assertSucceeds(createStoreAs('bob', 'sDT', 'shop-dien-tu', { template: 'dien-tu' }))
    await assertSucceeds(createStoreAs('bob', 'sNT', 'shop-noi-that', { template: 'noi-that' }))
    await assertFails(createStoreAs('bob', 'sXX', 'shop-la', { template: 'dien-tu-cong-nghe' }))
  })
  it('không chiếm slug đã có', async () => {
    await assertFails(createStoreAs('bob', 'sB', 'shop-alice'))
  })
  it('không tạo cửa hàng cho UID khác', async () => {
    const db = env.authenticatedContext('bob', { email: 'bob@test.vn' }).firestore()
    const b = writeBatch(db)
    b.set(doc(db, 'stores', 'sX'), storeData('alice', 'shop-x', { ownerEmail: 'bob@test.vn' }))
    b.set(doc(db, 'slugs', 'shop-x'), { storeId: 'sX', ownerUid: 'bob' })
    await assertFails(b.commit())
  })
  it('khách xem cửa hàng đang hoạt động, không xem cửa hàng đã tắt', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'stores/sA')))
    await assertFails(getDoc(doc(db, 'stores/sOff')))
  })
  it('chỉ liệt kê cửa hàng của mình', async () => {
    const bob = env.authenticatedContext('bob').firestore()
    await assertFails(getDocs(collection(bob, 'stores')))
    await assertSucceeds(getDocs(query(collection(bob, 'stores'), where('ownerUid', '==', 'bob'))))
  })
  it('người khác không sửa được', async () => {
    const bob = env.authenticatedContext('bob').firestore()
    await assertFails(updateDoc(doc(bob, 'stores/sA'), { name: 'Hack' }))
  })
  it('chủ shop sửa thông tin, không tự bật/tắt hay đổi chủ', async () => {
    const alice = env.authenticatedContext('alice').firestore()
    await assertSucceeds(updateDoc(doc(alice, 'stores/sA'), { name: 'Mới', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(alice, 'stores/sA'), { active: false }))
    await assertFails(updateDoc(doc(alice, 'stores/sA'), { ownerUid: 'bob' }))
  })
})

describe('sản phẩm', () => {
  it('chủ shop thêm/xoá, người khác không', async () => {
    const alice = env.authenticatedContext('alice').firestore()
    const bob = env.authenticatedContext('bob').firestore()
    await assertSucceeds(setDoc(doc(alice, 'stores/sA/products/p2'), { ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
    await assertFails(setDoc(doc(bob, 'stores/sA/products/p3'), { ...product }))
    await assertFails(deleteDoc(doc(bob, 'stores/sA/products/p1')))
    await assertSucceeds(deleteDoc(doc(alice, 'stores/sA/products/p1')))
  })
  it('khách đọc sản phẩm', async () => {
    await assertSucceeds(getDocs(collection(env.unauthenticatedContext().firestore(), 'stores/sA/products')))
  })
  it('chặn ảnh base64 quá lớn ở thumb', async () => {
    const alice = env.authenticatedContext('alice').firestore()
    await assertFails(setDoc(doc(alice, 'stores/sA/products/p4'), { ...product, thumb: 'x'.repeat(50000) }))
  })
})

describe('đơn hàng', () => {
  it('khách đặt đơn (không cần đăng nhập)', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertSucceeds(setDoc(doc(db, 'stores/sA/orders/ABC12345'), order({ payment: 'bank' })))
  })
  it('không đặt đơn với trạng thái khác "new"', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, 'stores/sA/orders/ABC12346'), order({ status: 'done' })))
  })
  it('không đặt đơn vào cửa hàng đã tắt', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, 'stores/sOff/orders/ABC12347'), order()))
  })
  it('chỉ chủ shop xem/sửa đơn', async () => {
    const alice = env.authenticatedContext('alice').firestore()
    const bob = env.authenticatedContext('bob').firestore()
    await assertFails(getDocs(collection(bob, 'stores/sA/orders')))
    await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(), 'stores/sA/orders')))
    await assertSucceeds(getDocs(collection(alice, 'stores/sA/orders')))
    await assertSucceeds(updateDoc(doc(alice, 'stores/sA/orders/ORD001'), { status: 'shipping', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(alice, 'stores/sA/orders/ORD001'), { total: 1 }))
  })
})

describe('mã giảm giá & đánh giá', () => {
  it('chủ shop tạo mã, khách chỉ get theo mã', async () => {
    const alice = env.authenticatedContext('alice').firestore()
    await assertSucceeds(setDoc(doc(alice, 'stores/sA/coupons/GIAM10'), { code: 'GIAM10', type: 'percent', value: 10, minOrder: 0, expiresAt: '', active: true }))
    const anon = env.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(anon, 'stores/sA/coupons/GIAM10')))
    await assertFails(getDocs(collection(anon, 'stores/sA/coupons')))
    await assertFails(setDoc(doc(alice, 'stores/sA/coupons/BAD'), { code: 'BAD', type: 'percent', value: 150, minOrder: 0, expiresAt: '', active: true }))
  })
  it('khách đánh giá 1–5 sao cho sản phẩm có thật', async () => {
    const anon = env.unauthenticatedContext().firestore()
    const r = { productId: 'p1', name: 'An', rating: 5, comment: 'Ngon', createdAt: serverTimestamp() }
    await assertSucceeds(setDoc(doc(anon, 'stores/sA/reviews/r1'), r))
    await assertFails(setDoc(doc(anon, 'stores/sA/reviews/r2'), { ...r, rating: 6 }))
    await assertFails(setDoc(doc(anon, 'stores/sA/reviews/r3'), { ...r, productId: 'khong-co' }))
    await assertFails(deleteDoc(doc(anon, 'stores/sA/reviews/r1')))
  })
})

describe('quản trị nền tảng', () => {
  it('admin Google xem tất cả + bật/tắt cửa hàng', async () => {
    const admin = env.authenticatedContext('admin', ADMIN).firestore()
    await assertSucceeds(getDocs(collection(admin, 'stores')))
    await assertSucceeds(getDocs(collection(admin, 'stores/sA/orders')))
    await assertSucceeds(updateDoc(doc(admin, 'stores/sA'), { active: false, updatedAt: serverTimestamp() }))
    await assertSucceeds(setDoc(doc(admin, 'platform/templates'), { disabled: ['cafe'] }))
  })
  it('cùng email nhưng đăng nhập mật khẩu thì không phải admin', async () => {
    const fake = env.authenticatedContext('fake', { ...ADMIN, firebase: { sign_in_provider: 'password' } }).firestore()
    await assertFails(getDocs(collection(fake, 'stores')))
    await assertFails(setDoc(doc(fake, 'platform/templates'), { disabled: [] }))
  })
})
