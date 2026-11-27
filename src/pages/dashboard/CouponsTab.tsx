import { useEffect, useState, type FormEvent } from 'react'
import { Alert, Spinner } from '../../components/ui'
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from '../../lib/db'
import { formatVND } from '../../lib/money'
import type { Coupon } from '../../lib/types'
import { useDash } from './DashContext'

export default function CouponsTab() {
  const { store } = useDash()
  const [list, setList] = useState<Coupon[] | null>(null)
  const [code, setCode] = useState('')
  const [type, setType] = useState<Coupon['type']>('percent')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const reload = () => listCoupons(store.id).then(setList, (e) => setErr((e as Error).message))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void reload(), [store.id])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    const c = code.trim().toUpperCase()
    if (!/^[A-Z0-9]{3,20}$/.test(c)) return setErr('Mã gồm 3–20 chữ cái in hoa hoặc số, không dấu, không khoảng trắng.')
    const v = Number(value)
    if (!(v > 0) || (type === 'percent' && v > 100)) return setErr(type === 'percent' ? 'Phần trăm giảm phải từ 1 đến 100.' : 'Số tiền giảm phải lớn hơn 0.')
    const mu = Math.round(Number(maxUses) || 0)
    if (mu < 0) return setErr('Số lượt dùng tối đa không hợp lệ.')
    const fields = { type, value: Math.round(v), minOrder: Math.max(0, Math.round(Number(minOrder) || 0)), expiresAt, maxUses: mu }
    try {
      if (editing) await updateCoupon(store.id, editing, fields)
      else await createCoupon(store.id, { code: c, ...fields, active: true })
      resetForm()
      await reload()
    } catch (e2) {
      setErr((e2 as Error).message)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setCode('')
    setType('percent')
    setValue('')
    setMinOrder('')
    setExpiresAt('')
    setMaxUses('')
  }
  const startEdit = (c: Coupon) => {
    setErr('')
    setEditing(c.code)
    setCode(c.code)
    setType(c.type)
    setValue(String(c.value))
    setMinOrder(c.minOrder ? String(c.minOrder) : '')
    setExpiresAt(c.expiresAt)
    setMaxUses(c.maxUses ? String(c.maxUses) : '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const toggle = async (c: Coupon) => {
    try {
      await updateCoupon(store.id, c.code, { active: !c.active })
      await reload()
    } catch (e2) {
      setErr((e2 as Error).message)
    }
  }
  const remove = async (c: Coupon) => {
    if (!confirm(`Xoá mã ${c.code}?`)) return
    await deleteCoupon(store.id, c.code)
    await reload()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="font-bold">{editing ? `Sửa mã ${editing}` : 'Tạo mã giảm giá'}</h2>
        {err && <Alert>{err}</Alert>}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="c-code">Mã</label>
            <input id="c-code" className="field uppercase" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="GIAM10" disabled={Boolean(editing)} />
          </div>
          <div>
            <label className="label" htmlFor="c-type">Loại</label>
            <select id="c-type" className="field" value={type} onChange={(e) => setType(e.target.value as Coupon['type'])}>
              <option value="percent">Giảm theo %</option>
              <option value="fixed">Giảm số tiền</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="c-value">{type === 'percent' ? 'Giảm (%)' : 'Giảm (₫)'}</label>
            <input id="c-value" className="field" type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="c-min">Đơn tối thiểu (₫)</label>
            <input id="c-min" className="field" type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="c-max">Số lượt dùng tối đa</label>
            <input id="c-max" className="field" type="number" min={0} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Để trống = không giới hạn" />
          </div>
          <div>
            <label className="label" htmlFor="c-exp">Hết hạn (trống = không hết hạn)</label>
            <input id="c-exp" className="field" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary w-full">{editing ? 'Lưu thay đổi' : 'Lưu mã'}</button>
        {editing && <button type="button" className="btn-ghost w-full" onClick={resetForm}>Huỷ sửa</button>}
      </form>
      {!list ? (
        <Spinner />
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.code} className="card flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="font-mono font-bold">{c.code} {!c.active && <span className="font-sans text-xs text-slate-400">(tắt)</span>}</div>
                <div className="text-xs text-slate-500">
                  Giảm {c.type === 'percent' ? `${c.value}%` : formatVND(c.value)}
                  {c.minOrder ? ` · đơn từ ${formatVND(c.minOrder)}` : ''}
                  {c.expiresAt ? ` · HSD ${c.expiresAt.split('-').reverse().join('/')}` : ''}
                </div>
                <div className="text-xs text-slate-500" data-testid="coupon-usage">Đã dùng {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''} lượt</div>
              </div>
              <button type="button" className="btn-ghost px-2.5" onClick={() => startEdit(c)}>Sửa</button>
              <button type="button" className="btn-ghost px-2.5" onClick={() => toggle(c)}>{c.active ? 'Tắt' : 'Bật'}</button>
              <button type="button" className="btn-ghost px-2.5 text-rose-600" onClick={() => remove(c)}>Xoá</button>
            </li>
          ))}
          {!list.length && <li className="py-6 text-center text-slate-500">Chưa có mã giảm giá.</li>}
        </ul>
      )}
    </div>
  )
}
