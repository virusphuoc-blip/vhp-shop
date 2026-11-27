import { describe, expect, it } from 'vitest'
import { categoryLabel, fromFields, injectOg, ogDescription, toOgStore } from '../../api/store-og'

const base = toOgStore('tra-workshop', { name: 'Trà Workshop', template: 'cafe', address: 'Q1, TP.HCM', theme: { banner: '' } })

describe('Open Graph cửa hàng', () => {
  it('giải mã Firestore REST', () => {
    expect(fromFields({ name: { stringValue: 'A' }, theme: { mapValue: { fields: { logo: { stringValue: 'x' } } } }, n: { integerValue: '3' } }))
      .toEqual({ name: 'A', theme: { logo: 'x' }, n: 3 })
  })
  it('ngành hàng theo mẫu, kể cả mẫu cũ lưu ở variant', () => {
    expect(categoryLabel({ template: 'tap-hoa', variant: 'dien-tu-cong-nghe' })).toBe('điện tử')
    expect(categoryLabel({ template: 'cafe', variant: '' })).toBe('cafe')
  })
  it('mô tả mặc định theo shop khi chưa nhập', () => {
    const d = ogDescription(base, ['Trà đào', 'Trà sữa', 'Bạc xỉu', 'Cà phê'])
    expect(d).toContain('Trà Workshop – cửa hàng cafe tại Q1, TP.HCM')
    expect(d).toContain('Trà đào, Trà sữa, Bạc xỉu.')
    expect(d).not.toContain('VHP Shop')
  })
  it('dùng mô tả shop nếu có, báo tạm đóng', () => {
    expect(ogDescription({ ...base, description: 'Trà ngon' }, [])).toBe('Trà ngon')
    expect(ogDescription({ ...base, description: 'Trà ngon', closed: true, closedReason: 'Nghỉ Tết' }, [])).toBe('Cửa hàng tạm đóng (Nghỉ Tết). Trà ngon')
  })
  it('thay thẻ trong index.html, có escape', () => {
    const html = '<head><title>VHP Shop</title><link rel="canonical" href="https://x/" /><meta name="description" content="nền tảng" /><meta property="og:title" content="VHP Shop" /></head>'
    const out = injectOg(html, { title: 'A "&" B', description: 'mô tả', url: 'https://h/s/a', image: 'https://h/i.png' })
    expect(out).toContain('<title>A &quot;&amp;&quot; B</title>')
    expect(out).toContain('<meta property="og:title" content="A &quot;&amp;&quot; B" />')
    expect(out).toContain('<meta name="description" content="mô tả" />')
    expect(out).toContain('href="https://h/s/a"')
    expect(out).toContain('<meta property="og:image" content="https://h/i.png" />')
    expect(out).not.toContain('nền tảng')
  })
})
