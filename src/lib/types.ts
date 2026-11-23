/** Giá trị firestore.rules cho phép ở trường `template` của cửa hàng. */
export type StoredTemplateId = 'xe-may' | 'do-choi' | 'quan-ao' | 'cafe' | 'tap-hoa' | 'do-an'

/** Ngành hàng (mỗi ngành có 4 mẫu). */
export type CategoryId = StoredTemplateId | 'dien-tu' | 'noi-that'

export type TemplateId =
  | CategoryId
  | 'xe-may-showroom' | 'xe-may-the-thao' | 'xe-may-co-dien'
  | 'do-choi-pastel' | 'do-choi-vu-tru' | 'do-choi-go'
  | 'quan-ao-street' | 'quan-ao-nu-tinh' | 'quan-ao-tre-trung'
  | 'cafe-dem' | 'cafe-san-vuon' | 'cafe-toi-gian'
  | 'tap-hoa-sieu-thi' | 'tap-hoa-sach' | 'tap-hoa-24h'
  | 'do-an-quan-nhau' | 'do-an-healthy' | 'do-an-com-nha'
  | 'dien-tu-cong-nghe' | 'dien-tu-gia-dung' | 'dien-tu-cao-cap'
  | 'noi-that-bac-au' | 'noi-that-go' | 'noi-that-sang-trong'

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
  /** Mẫu cụ thể trong ngành hàng (lưu trong theme vì `template` chỉ nhận id ngành hàng). */
  variant?: TemplateId
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
