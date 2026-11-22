export type HostMode =
  | { kind: 'platform' }
  | { kind: 'subdomain'; slug: string }
  | { kind: 'custom'; domain: string }

/** Subdomains of the root domain that never belong to a customer store. */
export const RESERVED_SLUGS = new Set([
  'www', 'shop', 'app', 'admin', 'api', 'mail', 'email', 'smtp', 'ftp', 'cdn', 'static', 'assets',
  'game', 'qr', 'chat', 'blog', 'docs', 'help', 'support', 'status', 'dev', 'test', 'staging',
  'quan-tri', 'quan-ly', 'dang-nhap', 'dang-ky', 'mau', 'vhp', 'vhphuoc', 'login', 'register',
])

export interface HostConfig {
  rootDomain: string
  appHosts: string[]
}

export function resolveHost(hostname: string, cfg: HostConfig): HostMode {
  const h = hostname.toLowerCase().replace(/\.$/, '')
  const root = cfg.rootDomain
  if (
    h === 'localhost' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(h) ||
    h.startsWith('[') ||
    h.endsWith('.vercel.app') ||
    h.endsWith('.pages.dev') ||
    cfg.appHosts.includes(h) ||
    h === root ||
    h === `www.${root}`
  ) {
    return { kind: 'platform' }
  }
  const sub = h.endsWith(`.${root}`) ? h.slice(0, -root.length - 1) : h.endsWith('.localhost') ? h.slice(0, -10) : null
  if (sub !== null) {
    if (sub.includes('.') || RESERVED_SLUGS.has(sub)) return { kind: 'platform' }
    return { kind: 'subdomain', slug: sub }
  }
  return { kind: 'custom', domain: h.replace(/^www\./, '') }
}
