import { describe, expect, it } from 'vitest'
import { slugify, validateSlug, normalizeDomain, isApexDomain } from './slug'
import { buildVietQRPayload, crc16 } from './vietqr'
import { computeDiscount } from './coupon'
import { resolveHost } from './host'
import { buildZaloOrderText, zaloLink } from './zalo'
import { requiredRecords } from './dns'

describe('slug', () => {
  it('bỏ dấu tiếng Việt', () => {
    expect(slugify('Tiệm Xe Đức Phát')).toBe('tiem-xe-duc-phat')
    expect(slugify('  Cà phê   Sữa đá!! ')).toBe('ca-phe-sua-da')
  })
  it('validate', () => {
    expect(validateSlug('ab')).not.toBeNull()
    expect(validateSlug('admin')).not.toBeNull()
    expect(validateSlug('shop-hoa')).toBeNull()
  })
  it('domain', () => {
    expect(normalizeDomain('https://WWW.ShopABC.vn/abc')).toBe('www.shopabc.vn')
    expect(isApexDomain('shopabc.vn')).toBe(true)
    expect(isApexDomain('shop.com.vn')).toBe(true)
    expect(isApexDomain('www.shop.com.vn')).toBe(false)
  })
})

describe('dns records', () => {
  it('apex dùng A + www CNAME', () => {
    expect(requiredRecords('shopabc.vn').map((r) => r.type)).toEqual(['A', 'CNAME'])
  })
  it('subdomain dùng CNAME', () => {
    expect(requiredRecords('www.shopabc.vn')).toEqual([{ type: 'CNAME', host: 'www', value: 'cname.vercel-dns.com' }])
    expect(requiredRecords('shop.abc.com.vn')[0].host).toBe('shop')
  })
})

describe('vietqr', () => {
  it('crc16 CCITT', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
  it('payload có BIN, STK, số tiền, CRC hợp lệ', () => {
    const p = buildVietQRPayload('970436', '0123456789', 150000, 'DH ABC123')
    expect(p).toContain('970436')
    expect(p).toContain('0123456789')
    expect(p).toContain('5406150000')
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)))
  })
})

describe('coupon', () => {
  const c = { code: 'GIAM10', type: 'percent' as const, value: 10, minOrder: 100000, expiresAt: '2026-12-31', active: true }
  it('giảm %', () => expect(computeDiscount(200000, c, '2026-11-01').discount).toBe(20000))
  it('chưa đủ tối thiểu', () => expect(computeDiscount(50000, c, '2026-11-01').error).toBeTruthy())
  it('hết hạn', () => expect(computeDiscount(200000, c, '2027-01-01').error).toBeTruthy())
  it('cố định không vượt tổng', () => expect(computeDiscount(30000, { ...c, type: 'fixed', value: 50000, minOrder: 0 }, '2026-11-01').discount).toBe(30000))
})

describe('host', () => {
  const cfg = { rootDomain: 'vhphuoc.shop', appHosts: ['shop.vhphuoc.shop'] }
  it('platform', () => {
    expect(resolveHost('localhost', cfg).kind).toBe('platform')
    expect(resolveHost('shop.vhphuoc.shop', cfg).kind).toBe('platform')
    expect(resolveHost('vhp-shop.vercel.app', cfg).kind).toBe('platform')
    expect(resolveHost('www.vhphuoc.shop', cfg).kind).toBe('platform')
  })
  it('subdomain', () => expect(resolveHost('tiem-xe.vhphuoc.shop', cfg)).toEqual({ kind: 'subdomain', slug: 'tiem-xe' }))
  it('custom', () => expect(resolveHost('www.shopabc.vn', cfg)).toEqual({ kind: 'custom', domain: 'shopabc.vn' }))
})

describe('zalo', () => {
  it('link + nội dung', () => {
    expect(zaloLink('0912 345 678')).toBe('https://zalo.me/0912345678')
    const t = buildZaloOrderText({
      storeName: 'Shop A',
      orderId: 'ABC123',
      items: [{ productId: 'p', name: 'Áo', price: 100000, qty: 2, size: 'M', note: '' }],
      customer: { name: 'An', phone: '0912345678', address: 'HN', note: '' },
      modeLabel: 'Giao tận nơi',
      booking: '',
      total: 200000,
    })
    expect(t).toContain('ABC123')
    expect(t).toContain('Áo (size M) x2')
  })
})

describe('templates', async () => {
  const { TEMPLATES, CATEGORIES, resolveTemplateId, storedTemplateId } = await import('../templates')
  const { sampleProducts } = await import('../templates/samples')
  it('has 8 categories × 4 templates with 6 samples each', () => {
    expect(CATEGORIES).toHaveLength(8)
    expect(TEMPLATES).toHaveLength(32)
    for (const c of CATEGORIES) expect(TEMPLATES.filter((t) => t.category === c.id)).toHaveLength(4)
    for (const t of TEMPLATES) {
      const samples = sampleProducts(t.id)
      expect(samples).toHaveLength(6)
      const keys = new Set(t.specFields.map((f) => f.key))
      for (const p of samples) {
        expect(t.categories).toContain(p.category)
        for (const k of Object.keys(p.specs)) expect(keys.has(k)).toBe(true)
      }
    }
  })
  it('stores only rule-allowed template ids and resolves the variant back', () => {
    const allowed = ['xe-may', 'do-choi', 'quan-ao', 'cafe', 'tap-hoa', 'do-an', 'dien-tu', 'noi-that']
    for (const t of TEMPLATES) {
      const stored = storedTemplateId(t.id)
      expect(allowed).toContain(stored)
      expect(resolveTemplateId(stored, t.id)).toBe(t.id)
    }
    expect(storedTemplateId('dien-tu-cong-nghe')).toBe('dien-tu')
    expect(storedTemplateId('noi-that')).toBe('noi-that')
    expect(resolveTemplateId('tap-hoa', 'dien-tu-cong-nghe')).toBe('dien-tu-cong-nghe')
    expect(resolveTemplateId('quan-ao', 'noi-that-go')).toBe('noi-that-go')
    expect(resolveTemplateId('tap-hoa', 'tap-hoa-24h')).toBe('tap-hoa-24h')
    expect(resolveTemplateId('cafe', undefined)).toBe('cafe')
    expect(resolveTemplateId('cafe', 'xe-may-the-thao')).toBe('cafe')
  })
})

describe('plans', async () => {
  const { effectivePlan, canAddProduct, canChangeTemplate, canCreateStore } = await import('./plans')
  const now = Date.UTC(2026, 10, 24)
  const acc = (plan: 'free' | 'vip', vipExpiresAt?: number, createdAt = now - 1000) => ({ uid: 'u', email: 'a@b.vn', plan, vipExpiresAt, createdAt })
  it('VIP hết hạn thì về Thường', () => {
    expect(effectivePlan(acc('vip', now + 1), now)).toBe('vip')
    expect(effectivePlan(acc('vip', now - 1), now)).toBe('free')
    expect(effectivePlan(null, now)).toBe('free')
  })
  it('giới hạn sản phẩm và mẫu đọc từ cấu hình', () => {
    expect(canAddProduct({ maxTemplates: 1, maxProducts: 10 }, 9)).toBe(true)
    expect(canAddProduct({ maxTemplates: 1, maxProducts: 10 }, 10)).toBe(false)
    expect(canAddProduct({ maxTemplates: 1, maxProducts: 5 }, 6)).toBe(false)
    expect(canAddProduct({ maxTemplates: 32, maxProducts: 0 }, 500)).toBe(true)
    expect(canAddProduct(null, 500)).toBe(true)
    expect(canChangeTemplate({ maxTemplates: 1, maxProducts: 10 })).toBe(false)
    expect(canChangeTemplate({ maxTemplates: 32, maxProducts: 0 })).toBe(true)
  })
  it('tắt chế độ miễn phí chỉ chặn tài khoản Thường mới', () => {
    const closed = { freeMode: false, freeClosedAt: now }
    expect(canCreateStore({ freeMode: true }, acc('free'), now)).toBe(true)
    expect(canCreateStore(closed, acc('free', undefined, now - 1), now)).toBe(true)
    expect(canCreateStore(closed, acc('free', undefined, now + 1), now)).toBe(false)
    expect(canCreateStore(closed, null, now)).toBe(false)
    expect(canCreateStore(closed, acc('vip', now + 1, now + 1), now)).toBe(true)
  })
})

describe('nâng VIP qua chuyển khoản', async () => {
  const { makeVipOrderCode, nextVipExpiry, termPrice, paymentReady } = await import('./plans')
  it('mã đơn = VHP + 4 ký tự tài khoản + 6 ký tự ngẫu nhiên', () => {
    const code = makeVipOrderCode('rlyhXeX0g4Qx', () => 0)
    expect(code).toBe('VHPRLYHAAAAAA')
    expect(makeVipOrderCode('ab')).toMatch(/^VHPABXX[A-Z0-9]{6}$/)
  })
  it('hạn VIP cộng dồn khi còn hạn, tính từ bây giờ khi đã hết', () => {
    const now = new Date('2026-11-27T00:00:00').getTime()
    const exp = new Date('2026-12-10T00:00:00').getTime()
    expect(nextVipExpiry({ uid: 'u', email: '', plan: 'vip', vipExpiresAt: exp }, 1, now).getMonth()).toBe(0)
    expect(nextVipExpiry({ uid: 'u', email: '', plan: 'vip', vipExpiresAt: now - 1 }, 3, now).toISOString()).toBe(new Date('2027-02-27T00:00:00').toISOString())
    expect(nextVipExpiry(null, 12, now).getFullYear()).toBe(2027)
  })
  it('mốc chưa có giá thì chưa bán; thiếu tài khoản nhận thì chưa sẵn sàng', () => {
    const cfg = { bank: { bin: '970436', accountNo: '0123', accountName: 'A' }, prices: { m1: 50000, m3: 0 } }
    expect(termPrice(cfg, 'm1')).toBe(50000)
    expect(termPrice(cfg, 'm3')).toBeNull()
    expect(termPrice(cfg, 'm12')).toBeNull()
    expect(paymentReady(cfg)).toBe(true)
    expect(paymentReady({ ...cfg, bank: { bin: '', accountNo: '', accountName: '' } })).toBe(false)
    expect(paymentReady(null)).toBe(false)
  })
})
