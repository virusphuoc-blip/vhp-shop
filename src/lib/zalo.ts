import { formatVND } from './money'
import type { OrderCustomer, OrderItem } from './types'

export function zaloLink(phone: string): string {
  return `https://zalo.me/${phone.replace(/[^0-9]/g, '')}`
}

export interface ZaloOrderInput {
  storeName: string
  orderId: string
  items: OrderItem[]
  customer: OrderCustomer
  modeLabel: string
  booking: string
  total: number
}

export function buildZaloOrderText(o: ZaloOrderInput): string {
  const lines = [
    `Chào ${o.storeName}, mình muốn đặt hàng (mã đơn ${o.orderId}):`,
    ...o.items.map(
      (i) =>
        `- ${i.name}${i.size ? ` (size ${i.size})` : ''} x${i.qty} = ${formatVND(i.price * i.qty)}${i.note ? ` – ghi chú: ${i.note}` : ''}`,
    ),
    `Tổng cộng: ${formatVND(o.total)}`,
    `Hình thức: ${o.modeLabel}${o.booking ? ` – ${o.booking}` : ''}`,
    `Người nhận: ${o.customer.name} – ${o.customer.phone}`,
  ]
  if (o.customer.address) lines.push(`Địa chỉ: ${o.customer.address}`)
  if (o.customer.note) lines.push(`Ghi chú: ${o.customer.note}`)
  return lines.join('\n')
}
