import { useEffect, useState } from 'react'
import { Alert, Spinner } from '../../components/ui'
import { subscribeOrders, updateOrderStatus } from '../../lib/db'
import { formatVND } from '../../lib/money'
import { ORDER_STATUS_LABEL, PAYMENT_LABEL, type Order, type OrderStatus } from '../../lib/types'
import { useDash } from './DashContext'

const STATUSES: OrderStatus[] = ['new', 'shipping', 'done', 'cancelled']
const COLORS: Record<OrderStatus, string> = {
  new: 'bg-sky-100 text-sky-800',
  shipping: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-600',
}

export default function OrdersTab() {
  const { store, products, reloadProducts } = useDash()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [tab, setTab] = useState<OrderStatus>('new')
  const [err, setErr] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState('')

  useEffect(() => subscribeOrders(store.id, setOrders, (e) => setErr(e.message)), [store.id])

  const change = async (o: Order, s: OrderStatus) => {
    setBusy(o.id)
    setErr('')
    try {
      await updateOrderStatus(store.id, o, s, products)
      await reloadProducts()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy('')
    }
  }

  if (!orders) return err ? <Alert>{err}</Alert> : <Spinner />
  const list = orders.filter((o) => o.status === tab)
  return (
    <div>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
        {STATUSES.map((s) => (
          <button key={s} type="button" role="tab" aria-selected={tab === s} onClick={() => setTab(s)} className={`rounded-lg px-1 py-2 text-xs font-semibold sm:text-sm ${tab === s ? 'bg-white shadow' : 'text-slate-600'}`}>
            {ORDER_STATUS_LABEL[s]} ({orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>
      {err && <div className="mt-3"><Alert>{err}</Alert></div>}
      <p className="mt-2 text-xs text-slate-500">Tồn kho tự trừ khi chuyển đơn sang “Đang giao”/“Hoàn thành” và tự cộng lại nếu huỷ.</p>
      <ul className="mt-3 space-y-2">
        {list.map((o) => (
          <li key={o.id} className="card p-3" data-testid="dash-order">
            <button type="button" className="flex w-full items-start justify-between gap-2 text-left" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
              <div className="min-w-0">
                <div className="font-bold">#{o.id} · {o.customer.name}</div>
                <div className="text-xs text-slate-500">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : ''} · {PAYMENT_LABEL[o.payment]}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-indigo-700">{formatVND(o.total)}</div>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${COLORS[o.status]}`}>{ORDER_STATUS_LABEL[o.status]}</span>
              </div>
            </button>
            {open === o.id && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
                <p>📞 <a href={`tel:${o.customer.phone}`} className="text-indigo-700">{o.customer.phone}</a></p>
                <p>🚚 {o.mode}{o.booking ? ` – ${o.booking}` : ''}</p>
                {o.customer.address && <p>📍 {o.customer.address}</p>}
                {o.customer.note && <p>📝 {o.customer.note}</p>}
                <ul className="rounded-lg bg-slate-50 p-2">
                  {o.items.map((i, k) => (
                    <li key={k} className="flex justify-between gap-2">
                      <span>{i.name}{i.size ? ` (${i.size})` : ''} ×{i.qty}{i.note ? ` – ${i.note}` : ''}</span>
                      <span>{formatVND(i.price * i.qty)}</span>
                    </li>
                  ))}
                  {o.discount > 0 && <li className="flex justify-between text-emerald-700"><span>Giảm giá {o.couponCode}</span><span>−{formatVND(o.discount)}</span></li>}
                  {o.shipping > 0 && <li className="flex justify-between"><span>Phí giao</span><span>{formatVND(o.shipping)}</span></li>}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.filter((s) => s !== o.status).map((s) => (
                    <button key={s} type="button" disabled={busy === o.id} className={s === 'cancelled' ? 'btn-ghost text-rose-600' : 'btn-ghost'} onClick={() => change(o, s)}>
                      → {ORDER_STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
        {!list.length && <li className="py-10 text-center text-slate-500">Không có đơn nào.</li>}
      </ul>
    </div>
  )
}
