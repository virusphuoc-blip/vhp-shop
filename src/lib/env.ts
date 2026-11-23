const e = import.meta.env

function list(v: string | undefined, def: string): string[] {
  return (v || def)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export const ROOT_DOMAIN = (e.VITE_ROOT_DOMAIN || 'vhphuoc.shop').toLowerCase()
export const APP_HOSTS = list(e.VITE_APP_HOSTS, `shop.${ROOT_DOMAIN}`)
export const CNAME_TARGET = e.VITE_CNAME_TARGET || 'cname.vercel-dns.com'
export const APEX_IP = e.VITE_APEX_IP || '76.76.21.21'
export const PLATFORM_ADMIN_EMAIL = 'virusphuoc@gmail.com'
export const PLATFORM_ADMIN_ZALO = '0988474228'
export const USE_EMULATOR = e.VITE_FIREBASE_EMULATOR === '1'

/** Domain where the platform app (đăng ký, quản lý) is reachable for links. */
export const PRIMARY_APP_HOST = APP_HOSTS[0]
