import { PLATFORM_ADMIN_ZALO } from './env'
import type { PaymentConfig, Plan, PlanLimits, PlansConfig, PlatformSettings, UserAccount, VipOrderStatus, VipTerm } from './types'

export const PLAN_LABEL: Record<Plan, string> = { free: 'Thường', vip: 'VIP' }

export function effectivePlan(acc: UserAccount | null, now = Date.now()): Plan {
  return acc?.plan === 'vip' && (acc.vipExpiresAt || 0) > now ? 'vip' : 'free'
}

/** null khi quản trị chưa cấu hình giới hạn (chưa giới hạn). */
export function limitsFor(plans: PlansConfig | null, plan: Plan): PlanLimits | null {
  return plans ? plans[plan] : null
}

export function canChangeTemplate(limits: PlanLimits | null): boolean {
  return !limits || limits.maxTemplates > 1
}

export function canAddProduct(limits: PlanLimits | null, count: number): boolean {
  return !limits || limits.maxProducts === 0 || count < limits.maxProducts
}

/** Tài khoản được tạo cửa hàng mới: chế độ miễn phí bật, VIP còn hạn, hoặc tài khoản có từ trước khi tắt. */
export function canCreateStore(settings: PlatformSettings | null, acc: UserAccount | null, now = Date.now()): boolean {
  if (!settings || settings.freeMode) return true
  if (effectivePlan(acc, now) === 'vip') return true
  return !!acc?.createdAt && !!settings.freeClosedAt && acc.createdAt < settings.freeClosedAt
}

export function formatLimit(n: number | undefined, unit: string): string {
  if (n === undefined) return '—'
  return n === 0 ? 'Không giới hạn' : `${n} ${unit}`
}

export function productLimitMessage(max: number): string {
  return `Gói Thường chỉ đăng được tối đa ${max} sản phẩm — liên hệ quản trị (Zalo ${PLATFORM_ADMIN_ZALO}) để nâng lên VIP`
}

export const VIP_TERMS: { term: VipTerm; months: number }[] = [
  { term: 'm1', months: 1 },
  { term: 'm3', months: 3 },
  { term: 'm6', months: 6 },
  { term: 'm12', months: 12 },
]

export const VIP_ORDER_STATUS_LABEL: Record<VipOrderStatus, string> = {
  pending: 'Chờ chuyển khoản',
  submitted: 'Chờ quản trị xác nhận',
  approved: 'Đã kích hoạt VIP',
  rejected: 'Bị từ chối',
  cancelled: 'Đã huỷ',
}

export function addMonths(base: number, months: number): Date {
  const d = new Date(base)
  d.setMonth(d.getMonth() + months)
  return d
}

/** Hạn VIP mới: cộng dồn nếu VIP còn hạn, ngược lại tính từ bây giờ. */
export function nextVipExpiry(acc: UserAccount | null, months: number, now = Date.now()): Date {
  const base = effectivePlan(acc, now) === 'vip' && acc?.vipExpiresAt ? acc.vipExpiresAt : now
  return addMonths(base, months)
}

/** Giá đang bán của một mốc; null = chưa mở bán. */
export function termPrice(cfg: PaymentConfig | null, term: VipTerm): number | null {
  const p = cfg?.prices[term]
  return p && p > 0 ? p : null
}

export function paymentReady(cfg: PaymentConfig | null): boolean {
  return !!cfg && /^\d{6}$/.test(cfg.bank.bin) && !!cfg.bank.accountNo.trim() && !!cfg.bank.accountName.trim()
}

/** Mã đơn = nội dung chuyển khoản: "VHP" + 4 ký tự mã tài khoản + 6 ký tự ngẫu nhiên. */
export function makeVipOrderCode(uid: string, rand: () => number = Math.random): string {
  const user = (uid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() + 'XXXX').slice(0, 4)
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = ''
  for (let i = 0; i < 6; i++) r += abc[Math.floor(rand() * abc.length)]
  return `VHP${user}${r}`
}
