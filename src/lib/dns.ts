import { APEX_IP, CNAME_TARGET } from './env'
import { isApexDomain } from './slug'
import type { DomainStatus } from './types'

export interface DnsRecord {
  type: 'A' | 'CNAME'
  host: string
  value: string
}

/** DNS records the store owner must add at their domain registrar. */
export function requiredRecords(domain: string): DnsRecord[] {
  if (isApexDomain(domain)) {
    return [
      { type: 'A', host: '@', value: APEX_IP },
      { type: 'CNAME', host: 'www', value: CNAME_TARGET },
    ]
  }
  const parts = domain.split('.')
  const apexLen = isApexDomain(parts.slice(-3).join('.')) && parts.length > 3 ? 3 : 2
  return [{ type: 'CNAME', host: parts.slice(0, parts.length - apexLen).join('.'), value: CNAME_TARGET }]
}

interface DohAnswer {
  type: number
  data: string
}

async function doh(name: string, type: 'A' | 'CNAME'): Promise<string[]> {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`)
  if (!res.ok) throw new Error('Không kiểm tra được DNS.')
  const json = (await res.json()) as { Answer?: DohAnswer[] }
  return (json.Answer || []).map((a) => a.data.toLowerCase().replace(/\.$/, ''))
}

export interface DomainCheck {
  status: DomainStatus
  detail: string
}

/**
 * none    = chưa trỏ DNS về hệ thống
 * pending = DNS đã đúng nhưng tên miền chưa được gắn trên hosting / chưa có SSL
 * done    = tên miền đã mở được cửa hàng qua HTTPS
 */
export async function checkDomain(domain: string): Promise<DomainCheck> {
  const apex = isApexDomain(domain)
  const answers = apex ? await doh(domain, 'A') : await doh(domain, 'CNAME')
  const target = apex ? APEX_IP : CNAME_TARGET.toLowerCase()
  const pointed = answers.includes(target) || (!apex && (await doh(domain, 'A')).includes(APEX_IP))
  if (!pointed) {
    return {
      status: 'none',
      detail: answers.length
        ? `Đang trỏ tới ${answers.join(', ')} – chưa đúng bản ghi yêu cầu.`
        : 'Chưa tìm thấy bản ghi DNS. DNS có thể mất vài phút đến vài giờ để cập nhật.',
    }
  }
  try {
    const res = await fetch(`https://${domain}/version.json`, { cache: 'no-store' })
    const json = (await res.json()) as { app?: string }
    if (json.app === 'vhp-shop') return { status: 'done', detail: 'Tên miền đã hoạt động với HTTPS.' }
  } catch {
    /* not attached yet */
  }
  return { status: 'pending', detail: 'DNS đã trỏ đúng. Đang chờ quản trị viên gắn tên miền trên hosting và cấp SSL.' }
}
