import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Alert } from '../components/ui'
import { computeDiscount, todayISO } from '../lib/coupon'
import { formatVND } from '../lib/money'
import type { Coupon, OrderItem, PaymentMethod } from '../lib/types'
import { buildZaloOrderText } from '../lib/zalo'
import { useStore } from './StoreContext'

export interface OrderDoneState {
  orderId: string
  payment: PaymentMethod
  total: number
  zaloText: string
}

const PHONE_RE = /^(0|\+84)[0-9]{8,10}$/

export default function Checkout() {
  const { store, template, cart, cartTotal, link, api, clearCart, products } = useStore()
  const nav = useNavigate()
  const modes = template.orderModes
  const [mode, setMode] = useState(modes[0].id)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [booking, setBooking] = useState('')
  const [note, setNote] = useState('')
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponMsg, setCouponMsg] = useState('')
  const hasBank = Boolean(store.bank.bin && store.bank.accountNo)
  const [payment, setPayment] = useState<PaymentMethod>('cod')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [placed, setPlaced] = useState(false)

  if (!cart.length && !placed) return <Navigate to={link('gio-hang')} replace />

  const modeDef = modes.find((m) => m.id === mode) || modes[0]
  const subtotal = cartTotal
  const discount = coupon ? computeDiscount(subtotal, coupon, todayISO()).discount : 0
  const afterDiscount = subtotal - discount
  const shipping = modeDef.needsAddress && !(store.freeShipFrom > 0 && afterDiscount >= store.freeShipFrom) ? store.shippingFee : 0
  const total = afterDiscount + shipping

  const applyCoupon = async () => {
    setCouponMsg('')
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    try {
      const c = await api.getCoupon(code)
      const r = computeDiscount(subtotal, c, todayISO())
      if (r.error) {
        setCoupon(null)
        setCouponMsg(r.error)
      } else {
        setCoupon(c)
        setCouponMsg(`Đã áp dụng mã ${code}: giảm ${formatVND(r.discount)}`)
      }
    } catch {
      setCouponMsg('Không kiểm tra được mã, vui lòng thử lại.')
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    const ph = phone.replace(/[\s.]/g, '')
    if (!PHONE_RE.test(ph)) return setErr('Số điện thoại không hợp lệ.')
    if (modeDef.needsAddress && address.trim().length < 5) return setErr('Vui lòng nhập địa chỉ nhận hàng.')
    if (modeDef.booking && !booking) return setErr('Vui lòng chọn thời gian đặt bàn.')
    for (const i of cart) {
      const p = products.find((x) => x.id === i.productId)
      if (!p) return setErr(`"${i.name}" không còn bán, vui lòng xoá khỏi giỏ.`)
      if (p.stock < cart.filter((c) => c.productId === p.id).reduce((s, c) => s + c.qty, 0)) return setErr(`"${p.name}" chỉ còn ${p.stock} sản phẩm.`)
    }
    const items: OrderItem[] = cart.map((i) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty, size: i.size, note: i.note }))
    const customer = { name: name.trim(), phone: ph, address: modeDef.needsAddress ? address.trim() : '', note: note.trim() }
    const bookingText = modeDef.booking && booking ? new Date(booking).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''
    setBusy(true)
    try {
      const orderId = await api.placeOrder({
        items,
        customer,
        mode: modeDef.label,
        booking: bookingText,
        payment,
        subtotal,
        shipping,
        discount,
        couponCode: coupon && discount > 0 ? coupon.code : '',
        total,
      })
      const zaloText = buildZaloOrderText({ storeName: store.name, orderId, items, customer, modeLabel: modeDef.label, booking: bookingText, total })
      setPlaced(true)
      const state: OrderDoneState = { orderId, payment, total, zaloText }
      nav(link(`don-hang/${orderId}`), { replace: true, state })
      clearCart()
    } catch {
      setErr('Không đặt được đơn, vui lòng thử lại hoặc liên hệ cửa hàng.')
    } finally {
      setBusy(false)
    }
  }

  const payOptions: { id: PaymentMethod; label: string; desc: string; show: boolean }[] = [
    { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', desc: modeDef.needsAddress ? 'Trả tiền mặt khi nhận hàng.' : 'Trả tiền tại cửa hàng.', show: true },
    { id: 'bank', label: 'Chuyển khoản / VietQR', desc: 'Quét mã QR bằng app ngân hàng sau khi đặt.', show: hasBank },
    { id: 'zalo', label: 'Đặt qua Zalo', desc: 'Gửi nội dung đơn qua Zalo cho chủ shop.', show: Boolean(store.zalo) },
  ]

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5 px-4 py-5">
      <h1 className="font-heading text-2xl font-bold">Đặt hàng</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Hình thức nhận</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {modes.map((m) => (
            <label key={m.id} className={`flex cursor-pointer items-center gap-2 rounded-s border p-3 ${mode === m.id ? 'border-sp bg-sp/10' : 'border-sborder bg-ssurf'}`}>
              <input type="radio" name="mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} />
              <span className="text-sm font-semibold">{m.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Thông tin người đặt</h2>
        <input className="s-field" placeholder="Họ và tên" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} aria-label="Họ và tên" />
        <input className="s-field" type="tel" inputMode="tel" placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} required aria-label="Số điện thoại" />
        {modeDef.needsAddress && <textarea className="s-field" rows={2} placeholder="Địa chỉ nhận hàng" value={address} onChange={(e) => setAddress(e.target.value)} required maxLength={300} aria-label="Địa chỉ nhận hàng" />}
        {modeDef.booking && (
          <label className="block text-sm">
            Thời gian đến quán
            <input className="s-field mt-1" type="datetime-local" value={booking} onChange={(e) => setBooking(e.target.value)} required aria-label="Thời gian đặt bàn" />
          </label>
        )}
        <textarea className="s-field" rows={2} placeholder={template.itemNote ? 'Ghi chú cho đơn (số người, yêu cầu thêm...)' : 'Ghi chú (không bắt buộc)'} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} aria-label="Ghi chú đơn hàng" />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Mã giảm giá</h2>
        <div className="flex gap-2">
          <input className="s-field uppercase" placeholder="Nhập mã" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} aria-label="Mã giảm giá" />
          <button type="button" className="s-btn-outline shrink-0" onClick={applyCoupon}>Áp dụng</button>
        </div>
        {couponMsg && <p className={`text-sm ${coupon ? 'text-emerald-500' : 'text-sa'}`}>{couponMsg}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Thanh toán</h2>
        {payOptions.filter((o) => o.show).map((o) => (
          <label key={o.id} className={`flex cursor-pointer items-start gap-2 rounded-s border p-3 ${payment === o.id ? 'border-sp bg-sp/10' : 'border-sborder bg-ssurf'}`}>
            <input type="radio" name="payment" className="mt-1" value={o.id} checked={payment === o.id} onChange={() => setPayment(o.id)} />
            <span>
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="block text-xs text-smuted">{o.desc}</span>
            </span>
          </label>
        ))}
      </section>

      <section className="rounded-s border border-sborder bg-ssurf p-3 text-sm">
        <ul className="space-y-1 border-b border-sborder pb-2">
          {cart.map((i) => (
            <li key={i.key} className="flex justify-between gap-2">
              <span className="min-w-0">{i.name}{i.size ? ` (${i.size})` : ''} ×{i.qty}</span>
              <span className="shrink-0">{formatVND(i.qty * i.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between"><span>Tạm tính</span><span>{formatVND(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-emerald-500"><span>Giảm giá</span><span>−{formatVND(discount)}</span></div>}
          {modeDef.needsAddress && <div className="flex justify-between"><span>Phí giao hàng</span><span>{shipping ? formatVND(shipping) : 'Miễn phí'}</span></div>}
          <div className="flex justify-between pt-1 text-lg font-bold"><span>Tổng cộng</span><span className="text-sp" data-testid="order-total">{formatVND(total)}</span></div>
        </div>
      </section>

      {err && <Alert>{err}</Alert>}
      <button className="s-btn w-full py-3 text-base" disabled={busy}>{busy ? 'Đang đặt hàng...' : payment === 'zalo' ? 'Đặt hàng & gửi qua Zalo' : 'Đặt hàng'}</button>
      <Link to={link('gio-hang')} className="block text-center text-sm text-smuted underline">Quay lại giỏ hàng</Link>
    </form>
  )
}
