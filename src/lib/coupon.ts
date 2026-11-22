import type { Coupon } from './types'

export interface CouponResult {
  discount: number
  error: string | null
}

export function computeDiscount(subtotal: number, coupon: Coupon | null, today: string): CouponResult {
  if (!coupon) return { discount: 0, error: 'Mã giảm giá không tồn tại.' }
  if (!coupon.active) return { discount: 0, error: 'Mã giảm giá đã ngừng áp dụng.' }
  if (coupon.expiresAt && coupon.expiresAt < today) return { discount: 0, error: 'Mã giảm giá đã hết hạn.' }
  if (subtotal < (coupon.minOrder || 0)) {
    return { discount: 0, error: `Đơn tối thiểu ${Math.round(coupon.minOrder).toLocaleString('vi-VN')}₫ để dùng mã này.` }
  }
  const raw = coupon.type === 'percent' ? (subtotal * Math.min(coupon.value, 100)) / 100 : coupon.value
  return { discount: Math.max(0, Math.min(Math.round(raw), subtotal)), error: null }
}

export function todayISO(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
