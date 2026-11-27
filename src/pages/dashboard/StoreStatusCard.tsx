import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { AdminZaloLink } from '../../components/PlanBits'
import { Alert } from '../../components/ui'
import { setStoreOpen } from '../../lib/db'
import { useDash } from './DashContext'

export default function StoreStatusCard() {
  const { store, setStore } = useDash()
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const closed = store.status === 'closed'
  const closedByAdmin = closed && store.closedBy !== '' && store.closedBy !== store.ownerUid

  const change = async (open: boolean) => {
    if (!user) return
    const q = open
      ? 'Mở lại cửa hàng? Khách sẽ xem sản phẩm và đặt hàng như bình thường.'
      : 'Đóng cửa hàng? Khách sẽ thấy "Cửa hàng tạm đóng", không xem sản phẩm và không đặt hàng được. Dữ liệu vẫn giữ nguyên.'
    if (!confirm(q)) return
    setErr('')
    setBusy(true)
    try {
      const next = await setStoreOpen(store.id, open, user.uid, reason)
      setStore({ ...store, ...next })
      setReason('')
    } catch (e) {
      setErr((e as { code?: string }).code === 'permission-denied' ? 'Không đổi được trạng thái cửa hàng.' : (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card space-y-3" data-testid="store-status-card">
      <h2 className="font-bold">Trạng thái cửa hàng</h2>
      <p className="text-sm">
        Hiện tại:{' '}
        {closed ? <b className="text-rose-600">Đang tạm đóng</b> : <b className="text-emerald-600">Đang mở</b>}
        {closed && store.closedReason && <span className="text-slate-600"> · Lý do: {store.closedReason}</span>}
      </p>
      {err && <Alert>{err}</Alert>}
      {closedByAdmin ? (
        <Alert kind="warn">
          Quản trị nền tảng đã đóng cửa hàng này. Liên hệ quản trị qua <AdminZaloLink className="font-semibold" /> để mở lại.
        </Alert>
      ) : closed ? (
        <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => change(true)}>Mở lại cửa hàng</button>
      ) : (
        <>
          <div>
            <label className="label" htmlFor="close-reason">Lý do tạm đóng (không bắt buộc, khách sẽ thấy)</label>
            <input id="close-reason" className="field" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Nghỉ Tết đến 05/02" />
          </div>
          <button type="button" className="btn-ghost w-full text-rose-600" disabled={busy} onClick={() => change(false)}>Tạm đóng cửa hàng</button>
        </>
      )}
    </div>
  )
}
