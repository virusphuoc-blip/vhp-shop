import { RESERVED_SLUGS } from './host'

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/g, '')
}

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/

/** Returns an error message (Vietnamese) or null when the slug is valid. */
export function validateSlug(slug: string): string | null {
  if (slug.length < 3) return 'Tên miền phụ cần ít nhất 3 ký tự.'
  if (slug.length > 30) return 'Tên miền phụ tối đa 30 ký tự.'
  if (!SLUG_RE.test(slug)) return 'Chỉ dùng chữ thường không dấu, số và dấu gạch ngang (không ở đầu/cuối).'
  if (slug.includes('--')) return 'Không dùng hai dấu gạch ngang liền nhau.'
  if (RESERVED_SLUGS.has(slug)) return 'Tên này được hệ thống giữ lại, vui lòng chọn tên khác.'
  return null
}

export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
}

export const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

/** True when the domain is a registrable apex (e.g. abc.vn, abc.com.vn) rather than a subdomain. */
export function isApexDomain(domain: string): boolean {
  const parts = domain.split('.')
  const secondLevel = new Set(['com', 'net', 'org', 'edu', 'gov', 'info', 'biz', 'name', 'pro', 'health', 'int', 'ac', 'co'])
  if (parts.length === 2) return true
  if (parts.length === 3 && secondLevel.has(parts[1]) && parts[2].length === 2) return true
  return false
}
