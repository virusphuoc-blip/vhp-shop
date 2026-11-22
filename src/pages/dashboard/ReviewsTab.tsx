import { useEffect, useState } from 'react'
import { Alert, Spinner, Stars } from '../../components/ui'
import { deleteReview, listReviews } from '../../lib/db'
import type { Review } from '../../lib/types'
import { useDash } from './DashContext'

export default function ReviewsTab() {
  const { store, products } = useDash()
  const [list, setList] = useState<Review[] | null>(null)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState(0)
  useEffect(() => {
    listReviews(store.id).then(setList, (e) => setErr((e as Error).message))
  }, [store.id])
  const remove = async (r: Review) => {
    if (!confirm('Xoá đánh giá này?')) return
    await deleteReview(store.id, r.id)
    setList((l) => (l || []).filter((x) => x.id !== r.id))
  }
  if (err) return <Alert>{err}</Alert>
  if (!list) return <Spinner />
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0
  const shown = filter ? list.filter((r) => r.rating === filter) : list
  return (
    <div className="space-y-3">
      <div className="card flex items-center gap-3">
        <div className="text-3xl font-extrabold">{avg.toFixed(1)}</div>
        <div>
          <Stars value={avg} size={18} />
          <div className="text-xs text-slate-500">{list.length} đánh giá</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {[0, 5, 4, 3, 2, 1].map((n) => (
          <button key={n} type="button" onClick={() => setFilter(n)} className={`rounded-full border px-3 py-1 text-sm ${filter === n ? 'border-indigo-600 bg-indigo-50 font-semibold' : 'border-slate-300 bg-white'}`}>
            {n ? `${n}★` : 'Tất cả'}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {shown.map((r) => (
          <li key={r.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2"><b>{r.name}</b><Stars value={r.rating} size={13} /></div>
                <div className="text-xs text-slate-500">{products.find((p) => p.id === r.productId)?.name || 'Sản phẩm đã xoá'}{r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString('vi-VN')}` : ''}</div>
              </div>
              <button type="button" className="text-sm text-rose-600" onClick={() => remove(r)}>Xoá</button>
            </div>
            <p className="mt-1 text-sm">{r.comment}</p>
          </li>
        ))}
        {!shown.length && <li className="py-6 text-center text-slate-500">Chưa có đánh giá.</li>}
      </ul>
    </div>
  )
}
