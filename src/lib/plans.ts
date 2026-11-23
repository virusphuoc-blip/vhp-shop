import { PLATFORM_ADMIN_ZALO } from './env'
import type { Plan, PlanLimits, PlansConfig, PlatformSettings, UserAccount } from './types'

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
