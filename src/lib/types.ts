export type TemplateId = 'xe-may' | 'do-choi' | 'quan-ao' | 'cafe' | 'tap-hoa' | 'do-an'

export type OrderStatus = 'new' | 'shipping' | 'done' | 'cancelled'
export type PaymentMethod = 'cod' | 'bank' | 'zalo'
export type DomainStatus = 'none' | 'pending' | 'done'

export interface StoreTheme {
  primary: string
  accent: string
  logo: string
  banner: string
  heroTitle: string
  heroSubtitle: string
}

export interface BankInfo {
  bin: string
  accountNo: string
  accountName: string
}

export interface Store {
  id: string
  ownerUid: string
  ownerEmail: string
  name: string
  slug: string
  template: TemplateId
  phone: string
  zalo: string
  address: string
  description: string
  openHours: string
  shippingFee: number
  freeShipFrom: number
  theme: StoreTheme
  bank: BankInfo
  customDomain: string
  domainStatus: DomainStatus
  active: boolean
  createdAt?: number
}

export interface Product {
  id: string
  name: string
  price: number
  oldPrice: number
  stock: number
  description: string
  category: string
  /** External image URLs pasted by the owner. */
  images: string[]
  /** Small base64 thumbnail of the first uploaded image (for lists). */
  thumb: string
  /** Number of uploaded (base64) images kept in productMedia/{id}. */
  uploadCount: number
  specs: Record<string, string>
  sizes: string[]
  active: boolean
  createdAt?: number
}

export interface Coupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrder: number
  expiresAt: string
  active: boolean
}

export interface Review {
  id: string
  productId: string
  name: string
  rating: number
  comment: string
  createdAt?: number
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  qty: number
  size: string
  note: string
}

export interface OrderCustomer {
  name: string
  phone: string
  address: string
  note: string
}

export interface Order {
  id: string
  items: OrderItem[]
  customer: OrderCustomer
  mode: string
  booking: string
  payment: PaymentMethod
  subtotal: number
  shipping: number
  discount: number
  couponCode: string
  total: number
  status: OrderStatus
  stockApplied: boolean
  createdAt?: number
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Mới',
  shipping: 'Đang giao',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank: 'Chuyển khoản / VietQR',
  zalo: 'Đặt qua Zalo',
}
