import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { countOrders } from '../../lib/db'
import { useDash } from './DashContext'

export default function Overview() {
  const { store, products } = useDash()
  const [today, setToday] = useState<number | null>(null)
  const [all, setAll] = useState<number | null>(null)
  useEffect(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    countOrders(store.id, start).then(setToday, () => setToday(-1))
    countOrders(store.id).then(setAll, () => setAll(-1))
  }, [store.id])
  const low = products.filter((p) => p.stock <= 3)
  const checklist = [
    { done: products.length > 0, text: 'Thêm sản phẩm đầu tiên', to: 'san-pham' },
    { done: Boolean(store.theme.logo), text: 'Tải logo cửa hàng', to: 'giao-dien' },
    { done: Boolean(store.bank.accountNo), text: 'Thêm tài khoản ngân hàng để nhận VietQR', to: 'cai-dat' },
  ]
  const stat = (v: number | null) => (v === null ? '…' : v < 0 ? '–' : v)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center"><div className="text-2xl font-extrabold">{products.length}</div><div className="text-xs text-slate-500">Sản phẩm</div></div>
        <div className="card text-center"><div className="text-2xl font-extrabold" data-testid="orders-today">{stat(today)}</div><div className="text-xs text-slate-500">Đơn hôm nay</div></div>
        <div className="card text-center"><div className="text-2xl font-extrabold">{stat(all)}</div><div className="text-xs text-slate-500">Tổng đơn</div></div>
      </div>
      <div className="card">
        <h2 className="font-bold">Việc cần làm</h2>
        <ul className="mt-2 space-y-2">
          {checklist.map((c) => (
            <li key={c.text} className="flex items-center gap-2 text-sm">
              <span>{c.done ? '✅' : '⬜'}</span>
              <Link to={`/quan-ly/${store.id}/${c.to}`} className={c.done ? 'text-slate-500 line-through' : 'font-medium text-indigo-700 hover:underline'}>{c.text}</Link>
            </li>
          ))}
        </ul>
      </div>
      {low.length > 0 && (
        <div className="card">
          <h2 className="font-bold">Sắp hết hàng</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {low.map((p) => (
              <li key={p.id} className="flex justify-between"><span className="truncate">{p.name}</span><b className={p.stock === 0 ? 'text-rose-600' : 'text-amber-600'}>{p.stock}</b></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
