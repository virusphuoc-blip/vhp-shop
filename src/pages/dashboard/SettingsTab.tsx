import { useState, type FormEvent } from 'react'
import { Alert } from '../../components/ui'
import { BANKS } from '../../lib/banks'
import { updateStore } from '../../lib/db'
import { mapsUrl } from '../../lib/maps'
import type { Store } from '../../lib/types'
import { useDash } from './DashContext'
import StoreStatusCard from './StoreStatusCard'

export default function SettingsTab() {
  const { store, setStore } = useDash()
  const [f, setF] = useState({
    name: store.name,
    phone: store.phone,
    zalo: store.zalo,
    address: store.address,
    mapLocation: store.mapLocation,
    description: store.description,
    openHours: store.openHours,
    shippingFee: String(store.shippingFee || 0),
    freeShipFrom: String(store.freeShipFrom || 0),
    bin: store.bank.bin,
    accountNo: store.bank.accountNo,
    accountName: store.bank.accountName,
  })
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (f.accountNo && !/^[0-9]{4,19}$/.test(f.accountNo.trim())) return setMsg({ kind: 'error', text: 'Số tài khoản chỉ gồm 4–19 chữ số.' })
    if (f.mapLocation.trim() && !mapsUrl(f.mapLocation)) return setMsg({ kind: 'error', text: 'Vị trí phải là link Google Maps (https://maps.app.goo.gl/..., https://www.google.com/maps/...) hoặc toạ độ dạng 10.7769,106.7009.' })
    if (f.accountNo && !f.bin) return setMsg({ kind: 'error', text: 'Vui lòng chọn ngân hàng.' })
    const patch: Partial<Store> = {
      name: f.name.trim(),
      phone: f.phone.trim(),
      zalo: f.zalo.trim(),
      address: f.address.trim(),
      mapLocation: f.mapLocation.trim(),
      description: f.description.trim(),
      openHours: f.openHours.trim(),
      shippingFee: Math.max(0, Math.round(Number(f.shippingFee) || 0)),
      freeShipFrom: Math.max(0, Math.round(Number(f.freeShipFrom) || 0)),
      bank: { bin: f.bin, accountNo: f.accountNo.trim(), accountName: f.accountName.trim().toUpperCase() },
    }
    setBusy(true)
    try {
      await updateStore(store.id, patch)
      setStore({ ...store, ...patch })
      setMsg({ kind: 'success', text: 'Đã lưu cài đặt.' })
    } catch (e2) {
      setMsg({ kind: 'error', text: (e2 as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const input = (k: keyof typeof f, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label className="label" htmlFor={`s-${k}`}>{label}</label>
      <input id={`s-${k}`} className="field" value={f[k]} onChange={(e) => set(k, e.target.value)} {...props} />
    </div>
  )

  const mapPreview = mapsUrl(f.mapLocation)
  return (
    <div className="space-y-4">
    <StoreStatusCard />
    <form onSubmit={submit} className="space-y-4">
      <div className="card space-y-3">
        <h2 className="font-bold">Thông tin cửa hàng</h2>
        {input('name', 'Tên cửa hàng', { required: true, maxLength: 80 })}
        <div className="grid grid-cols-2 gap-2">
          {input('phone', 'Số điện thoại', { type: 'tel', required: true })}
          {input('zalo', 'Số Zalo', { type: 'tel' })}
        </div>
        <div>
          <label className="label" htmlFor="s-address">Địa chỉ</label>
          <textarea id="s-address" className="field" rows={2} maxLength={300} value={f.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="s-mapLocation">Vị trí trên bản đồ (hiện mã QR ở trang cửa hàng)</label>
          <input id="s-mapLocation" className="field" maxLength={500} value={f.mapLocation} onChange={(e) => set('mapLocation', e.target.value)} placeholder="Link Google Maps hoặc toạ độ 10.7769,106.7009" />
          <p className="mt-1 text-xs text-slate-500">
            Mở Google Maps → chọn vị trí shop → Chia sẻ → Sao chép đường liên kết, hoặc nhập vĩ độ,kinh độ. Để trống thì không hiện mã QR.
            {mapPreview && <> {' '}<a href={mapPreview} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline">Kiểm tra vị trí ↗</a></>}
          </p>
        </div>
        <div>
          <label className="label" htmlFor="s-desc">Giới thiệu ngắn (hiện ở chân trang & SEO)</label>
          <textarea id="s-desc" className="field" rows={2} maxLength={300} value={f.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        {input('openHours', 'Giờ mở cửa', { maxLength: 60, placeholder: '7:00 – 22:00' })}
      </div>
      <div className="card space-y-3">
        <h2 className="font-bold">Giao hàng</h2>
        <div className="grid grid-cols-2 gap-2">
          {input('shippingFee', 'Phí giao hàng (₫)', { type: 'number', min: 0 })}
          {input('freeShipFrom', 'Miễn phí giao từ (₫, 0 = không)', { type: 'number', min: 0 })}
        </div>
      </div>
      <div className="card space-y-3">
        <h2 className="font-bold">Tài khoản nhận chuyển khoản (VietQR)</h2>
        <p className="text-xs text-slate-500">Khách chọn “Chuyển khoản” sẽ thấy mã VietQR có sẵn số tiền + nội dung, và số tài khoản này.</p>
        <div>
          <label className="label" htmlFor="s-bin">Ngân hàng</label>
          <select id="s-bin" className="field" value={f.bin} onChange={(e) => set('bin', e.target.value)}>
            <option value="">– Chọn ngân hàng –</option>
            {BANKS.map((b) => <option key={b.bin} value={b.bin}>{b.short} – {b.name}</option>)}
          </select>
        </div>
        {input('accountNo', 'Số tài khoản', { inputMode: 'numeric' })}
        {input('accountName', 'Tên chủ tài khoản (không dấu)', { maxLength: 60, placeholder: 'NGUYEN VAN A' })}
      </div>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu cài đặt'}</button>
    </form>
    </div>
  )
}
