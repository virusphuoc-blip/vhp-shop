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
    const b = writeBatch(alice)
    b.set(doc(alice, 'stores/sA/products/p2'), { ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    b.update(doc(alice, 'stores/sA'), { productCount: 1, lastProductId: 'p2' })
    await assertSucceeds(b.commit())
    const b2 = writeBatch(bob)
    b2.set(doc(bob, 'stores/sA/products/p3'), { ...product })
    b2.update(doc(bob, 'stores/sA'), { productCount: 2, lastProductId: 'p3' })
    await assertFails(b2.commit())
    await assertFails(deleteDoc(doc(bob, 'stores/sA/products/p1')))
    const b3 = writeBatch(alice)
    b3.delete(doc(alice, 'stores/sA/products/p1'))
    b3.update(doc(alice, 'stores/sA'), { productCount: 0, lastProductId: 'p1' })
    await assertSucceeds(b3.commit())
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

describe('gói Thường / VIP', () => {
  const DAY = 86400000
  async function seed(path: string, data: Record<string, unknown>) {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), path), data)
    })
  }
  const plans = (freeMax: number, freeTpl = 1) => ({ free: { maxTemplates: freeTpl, maxProducts: freeMax }, vip: { maxTemplates: 32, maxProducts: 0 } })
  const userDoc = (plan: 'free' | 'vip', vipExpiresAt: Date | null, createdAt = new Date()) => ({ email: 'x@test.vn', plan, vipExpiresAt, createdAt })
  function addProduct(db: ReturnType<RulesTestEnvironment['authenticatedContext']>['firestore'] extends () => infer F ? F : never, pid: string, count: number) {
    const b = writeBatch(db)
    b.set(doc(db, `stores/sA/products/${pid}`), { ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    b.update(doc(db, 'stores/sA'), { productCount: count, lastProductId: pid, updatedAt: serverTimestamp() })
    return b.commit()
  }
  const alice = () => env.authenticatedContext('alice', { email: 'alice@test.vn' }).firestore()

  it('người dùng tự tạo hồ sơ gói Thường, không tự nâng VIP', async () => {
    const db = alice()
    await assertFails(setDoc(doc(db, 'users/alice'), { email: 'alice@test.vn', plan: 'vip', vipExpiresAt: null, createdAt: serverTimestamp() }))
    await assertFails(setDoc(doc(db, 'users/bob'), { email: 'alice@test.vn', plan: 'free', vipExpiresAt: null, createdAt: serverTimestamp() }))
    await assertSucceeds(setDoc(doc(db, 'users/alice'), { email: 'alice@test.vn', plan: 'free', vipExpiresAt: null, createdAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(db, 'users/alice'), { plan: 'vip', vipExpiresAt: new Date(Date.now() + DAY) }))
    await assertFails(getDocs(collection(db, 'users')))
  })

  it('chỉ admin sửa cấu hình gói và tài khoản', async () => {
    const admin = env.authenticatedContext('admin', ADMIN).firestore()
    await assertSucceeds(setDoc(doc(admin, 'platformConfig/plans'), { ...plans(10), updatedAt: serverTimestamp() }))
    await assertFails(setDoc(doc(admin, 'platformConfig/plans'), { free: { maxTemplates: 0, maxProducts: 10 }, vip: { maxTemplates: 32, maxProducts: 0 } }))
    await assertSucceeds(setDoc(doc(admin, 'platformConfig/settings'), { freeMode: false, freeClosedAt: serverTimestamp() }))
    await assertSucceeds(setDoc(doc(admin, 'users/alice'), userDoc('vip', new Date(Date.now() + 30 * DAY))))
    await assertSucceeds(getDocs(collection(admin, 'users')))
    await assertFails(setDoc(doc(alice(), 'platformConfig/plans'), plans(1000, 32)))
    await assertFails(setDoc(doc(alice(), 'platformConfig/settings'), { freeMode: true, freeClosedAt: null }))
  })

  it('thêm/xoá sản phẩm phải đi kèm bộ đếm', async () => {
    const db = alice()
    await assertSucceeds(updateDoc(doc(db, 'stores/sA'), { productCount: 1 }))
    await assertFails(setDoc(doc(db, 'stores/sA/products/p2'), { ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
    await assertSucceeds(addProduct(db, 'p2', 2))
    await assertFails(updateDoc(doc(db, 'stores/sA'), { productCount: 0 }))
    await assertFails(deleteDoc(doc(db, 'stores/sA/products/p2')))
    const b = writeBatch(db)
    b.delete(doc(db, 'stores/sA/products/p2'))
    b.update(doc(db, 'stores/sA'), { productCount: 1, lastProductId: 'p2' })
    await assertSucceeds(b.commit())
  })

  it('gói Thường bị chặn khi vượt giới hạn sản phẩm, VIP còn hạn thì không', async () => {
    await seed('platformConfig/plans', plans(2))
    const db = alice()
    await assertSucceeds(updateDoc(doc(db, 'stores/sA'), { productCount: 1 }))
    await assertSucceeds(addProduct(db, 'p2', 2))
    await assertFails(addProduct(db, 'p3', 3))
    await seed('users/alice', userDoc('vip', new Date(Date.now() - DAY)))
    await assertFails(addProduct(db, 'p3', 3))
    await seed('users/alice', userDoc('vip', new Date(Date.now() + DAY)))
    await assertSucceeds(addProduct(db, 'p3', 3))
  })

  it('gói Thường không đổi được mẫu, VIP đổi được', async () => {
    await seed('platformConfig/plans', plans(10))
    const db = alice()
    await assertSucceeds(updateDoc(doc(db, 'stores/sA'), { 'theme.variant': 'cafe' }))
    await assertFails(updateDoc(doc(db, 'stores/sA'), { 'theme.variant': 'cafe-dem' }))
    await assertFails(updateDoc(doc(db, 'stores/sA'), { template: 'xe-may', 'theme.variant': 'xe-may' }))
    await assertSucceeds(updateDoc(doc(db, 'stores/sA'), { name: 'Tên mới' }))
    await seed('users/alice', userDoc('vip', new Date(Date.now() + DAY)))
    await assertSucceeds(updateDoc(doc(db, 'stores/sA'), { template: 'xe-may', 'theme.variant': 'xe-may-the-thao' }))
  })

  it('tắt chế độ miễn phí: tài khoản mới không tạo được cửa hàng, tài khoản cũ và VIP thì được', async () => {
    await seed('platformConfig/settings', { freeMode: false, freeClosedAt: new Date() })
    await assertFails(createStoreAs('dan', 'sD', 'shop-dan'))
    await seed('users/dan', userDoc('free', null, new Date(Date.now() - DAY)))
    await assertSucceeds(createStoreAs('dan', 'sD', 'shop-dan'))
    await seed('users/eve', userDoc('free', null, new Date(Date.now() + DAY)))
    await assertFails(createStoreAs('eve', 'sE', 'shop-eve'))
    await seed('users/eve', userDoc('vip', new Date(Date.now() + DAY)))
    await assertSucceeds(createStoreAs('eve', 'sE', 'shop-eve'))
  })
})

describe('nâng VIP qua chuyển khoản', () => {
  const bank = { bin: '970436', accountNo: '0123456789', accountName: 'VH PHUOC' }
  const pay = { bank, prices: { m1: 50000, m12: 500000 } }
  const ID = 'VHPALICABC234'
  const alice = () => env.authenticatedContext('alice', { email: 'alice@test.vn' }).firestore()
  const admin = () => env.authenticatedContext('admin', ADMIN).firestore()
  const vipOrder = (extra: Record<string, unknown> = {}) => ({
    uid: 'alice', email: 'alice@test.vn', term: 'm1', months: 1, amount: 50000, bank, status: 'pending', proof: '',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra,
  })
  async function seed(path: string, data: Record<string, unknown>) {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), path), data)
    })
  }

  it('chỉ admin sửa cài đặt nhận tiền, giá phải hợp lệ', async () => {
    await assertFails(setDoc(doc(alice(), 'platformConfig/payment'), pay))
    await assertFails(setDoc(doc(admin(), 'platformConfig/payment'), { bank, prices: { m1: -1 } }))
    await assertFails(setDoc(doc(admin(), 'platformConfig/payment'), { bank: { ...bank, bin: 'abc' }, prices: {} }))
    await assertSucceeds(setDoc(doc(admin(), 'platformConfig/payment'), { ...pay, updatedAt: serverTimestamp() }))
    await assertSucceeds(getDoc(doc(alice(), 'platformConfig/payment')))
  })

  it('khách tạo đơn đúng giá + tài khoản nhận; mốc chưa có giá thì không mua được', async () => {
    await assertFails(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder()))
    await seed('platformConfig/payment', pay)
    await assertFails(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder({ amount: 1000 })))
    await assertFails(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder({ term: 'm3', months: 3, amount: 150000 })))
    await assertFails(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder({ months: 12 })))
    await assertFails(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder({ bank: { ...bank, accountNo: '999' } })))
    await assertFails(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder({ uid: 'bob' })))
    await assertFails(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder({ status: 'approved' })))
    await assertSucceeds(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder()))
    await assertFails(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder()))
    await assertSucceeds(getDocs(query(collection(alice(), 'vipOrders'), where('uid', '==', 'alice'))))
    const bob = env.authenticatedContext('bob', { email: 'bob@test.vn' }).firestore()
    await assertFails(getDoc(doc(bob, `vipOrders/${ID}`)))
  })

  it('khách gửi bằng chứng, không tự duyệt; admin duyệt phải kích hoạt VIP cùng lần ghi', async () => {
    await seed('platformConfig/payment', pay)
    await assertSucceeds(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder()))
    await assertFails(updateDoc(doc(alice(), `vipOrders/${ID}`), { status: 'submitted', proof: '', submittedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(alice(), `vipOrders/${ID}`), { status: 'submitted', proof: 'https://i.imgur.com/x.png', submittedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(alice(), `vipOrders/${ID}`), { status: 'approved', decidedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(alice(), `vipOrders/${ID}`), { amount: 1 }))

    const exp = new Date(Date.now() + 30 * 86400000)
    await assertFails(updateDoc(doc(admin(), `vipOrders/${ID}`), { status: 'approved', decidedAt: serverTimestamp(), vipExpiresAt: exp }))
    const adb = admin()
    const b = writeBatch(adb)
    b.set(doc(adb, 'users/alice'), { email: 'alice@test.vn', plan: 'vip', vipExpiresAt: exp, createdAt: new Date() })
    b.update(doc(adb, `vipOrders/${ID}`), { status: 'approved', decidedAt: serverTimestamp(), vipExpiresAt: exp })
    await assertSucceeds(b.commit())
    await assertFails(updateDoc(doc(admin(), `vipOrders/${ID}`), { status: 'rejected', decidedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(alice(), `vipOrders/${ID}`), { status: 'cancelled' }))
  })

  it('khách huỷ đơn; admin từ chối đơn', async () => {
    await seed('platformConfig/payment', pay)
    await assertSucceeds(setDoc(doc(alice(), `vipOrders/${ID}`), vipOrder()))
    await assertSucceeds(updateDoc(doc(alice(), `vipOrders/${ID}`), { status: 'cancelled' }))
    await assertSucceeds(setDoc(doc(alice(), 'vipOrders/VHPALICXYZ789'), vipOrder()))
    await assertSucceeds(updateDoc(doc(admin(), 'vipOrders/VHPALICXYZ789'), { status: 'rejected', rejectReason: 'Chưa nhận được tiền', decidedAt: serverTimestamp() }))
  })
})
