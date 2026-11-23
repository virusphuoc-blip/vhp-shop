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
    const allowed = ['xe-may', 'do-choi', 'quan-ao', 'cafe', 'tap-hoa', 'do-an']
    for (const t of TEMPLATES) {
      const stored = storedTemplateId(t.id)
      expect(allowed).toContain(stored)
      expect(resolveTemplateId(stored, t.id)).toBe(t.id)
    }
    expect(resolveTemplateId('cafe', undefined)).toBe('cafe')
    expect(resolveTemplateId('cafe', 'xe-may-the-thao')).toBe('cafe')
  })
})
