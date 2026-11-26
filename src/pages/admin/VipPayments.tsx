import { useEffect, useMemo, useState } from 'react'
import { Alert, Modal, Spinner } from '../../components/ui'
import { BANKS, bankByBin } from '../../lib/banks'
import { approveVipOrder, getPaymentConfig, listVipOrders, rejectVipOrder, savePaymentConfig } from '../../lib/db'
import { formatVND } from '../../lib/money'
import { VIP_ORDER_STATUS_LABEL, VIP_TERMS } from '../../lib/plans'
import type { PaymentConfig, VipOrder, VipOrderStatus, VipTerm } from '../../lib/types'

export function PaymentSettings() {
  const [cfg, setCfg] = useState<PaymentConfig | null | undefined>(undefined)
  const [bin, setBin] = useState('')
  const [accountNo, setAccountNo] = useState('')
  const [accountName, setAccountName] = useState('')
  const [prices, setPrices] = useState<Record<VipTerm, string>>({ m1: '', m3: '', m6: '', m12: '' })
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    getPaymentConfig().then(
      (c) => {
        setCfg(c)
        if (!c) return
        setBin(c.bank.bin)
        setAccountNo(c.bank.accountNo)
        setAccountName(c.bank.accountName)
        setPrices({ m1: String(c.prices.m1 ?? ''), m3: String(c.prices.m3 ?? ''), m6: String(c.prices.m6 ?? ''), m12: String(c.prices.m12 ?? '') })
      },
      () => setCfg(null),
    )
  }, [])
  if (cfg === undefined) return <Spinner />
  const save = async () => {
    setMsg(null)
    if (!/^\d{6}$/.test(bin) || !accountNo.trim() || !accountName.trim()) return setMsg({ kind: 'error', text: 'Nhập đủ ngân hàng, số tài khoản và tên chủ tài khoản.' })
    const out: PaymentConfig['prices'] = {}
    for (const { term, months } of VIP_TERMS) {
      const raw = prices[term].trim()
      if (!raw || raw === '0') continue
      const n = Number(raw)
      if (!Number.isInteger(n) || n < 1000) return setMsg({ kind: 'error', text: `Giá VIP ${months} tháng phải là số nguyên ≥ 1.000đ (để trống = chưa mở bán).` })
      out[term] = n
    }
    setBusy(true)
    try {
      const next = { bank: { bin, accountNo: accountNo.trim(), accountName: accountName.trim().toUpperCase() }, prices: out }
      await savePaymentConfig(next)
      setCfg(next)
      setAccountName(next.bank.accountName)
      setMsg({ kind: 'success', text: 'Đã lưu cài đặt nhận tiền. Mã QR và giá cho khách đổi theo ngay.' })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="card space-y-2" data-testid="payment-settings">
      <h2 className="font-bold">Cài đặt nhận tiền nâng VIP</h2>
      {!cfg && <Alert kind="warn">Chưa cài đặt – khách chưa nâng VIP qua chuyển khoản được.</Alert>}
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="label text-xs">Ngân hàng</span>
          <select className="field" value={bin} onChange={(e) => setBin(e.target.value)} data-testid="pay-bank">
            <option value="">– Chọn ngân hàng –</option>
            {BANKS.map((b) => <option key={b.bin} value={b.bin}>{b.short}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label text-xs">Số tài khoản</span>
          <input className="field" inputMode="numeric" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} data-testid="pay-account-no" />
        </label>
        <label className="block">
          <span className="label text-xs">Tên chủ tài khoản</span>
          <input className="field uppercase" value={accountName} onChange={(e) => setAccountName(e.target.value)} data-testid="pay-account-name" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {VIP_TERMS.map(({ term, months }) => (
          <label key={term} className="block">
            <span className="label text-xs">Giá VIP {months} tháng (đ)</span>
            <input type="number" min={0} step={1000} className="field" value={prices[term]} onChange={(e) => setPrices({ ...prices, [term]: e.target.value })} data-testid={`pay-price-${term}`} />
          </label>
        ))}
      </div>
      <p className="text-xs text-slate-500">Để trống giá = mốc đó chưa mở bán (khách thấy thông báo liên hệ quản trị).</p>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <button type="button" className="btn-primary w-full" disabled={busy} onClick={save} data-testid="pay-save">Lưu cài đặt nhận tiền</button>
    </section>
  )
}

const FILTERS: { id: 'waiting' | VipOrderStatus | 'all'; label: string }[] = [
  { id: 'waiting', label: 'Cần xử lý' },
  { id: 'approved', label: 'Đã kích hoạt' },
  { id: 'rejected', label: 'Từ chối' },
  { id: 'cancelled', label: 'Khách huỷ' },
  { id: 'all', label: 'Tất cả' },
]

export function VipOrdersAdmin({ onChanged }: { onChanged: () => void }) {
  const [orders, setOrders] = useState<VipOrder[] | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('waiting')
  const [err, setErr] = useState('')
  const [busyId, setBusyId] = useState('')
  const [proof, setProof] = useState<VipOrder | null>(null)
  const reload = () => listVipOrders().then(setOrders, (e) => setErr((e as Error).message))
  useEffect(() => {
    void reload()
  }, [])
  const shown = useMemo(
    () => (orders || []).filter((o) => filter === 'all' || (filter === 'waiting' ? o.status === 'pending' || o.status === 'submitted' : o.status === filter)),
    [orders, filter],
  )
  const act = async (o: VipOrder, approve: boolean) => {
    setErr('')
    let reason = ''
    if (approve) {
      if (!confirm(`Xác nhận đã nhận ${formatVND(o.amount)} với nội dung ${o.id}? VIP ${o.months} tháng sẽ được kích hoạt cho ${o.email}.`)) return
    } else {
      const r = prompt('Lý do từ chối (khách sẽ thấy):', 'Chưa nhận được tiền')
      if (r === null) return
      reason = r.slice(0, 300)
    }
    setBusyId(o.id)
    try {
      if (approve) await approveVipOrder(o)
      else await rejectVipOrder(o.id, reason)
      await reload()
      onChanged()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusyId('')
    }
  }
  const waiting = (orders || []).filter((o) => o.status === 'pending' || o.status === 'submitted').length
  return (
    <section data-testid="vip-orders-admin">
      <h2 className="text-lg font-bold">Yêu cầu nâng VIP {waiting > 0 && <span className="rounded-full bg-rose-600 px-2 text-sm text-white">{waiting}</span>}</h2>
      <p className="text-xs text-slate-500">Đối soát sao kê theo nội dung chuyển khoản (mã đơn) và số tiền, rồi bấm xác nhận — hệ thống tự kích hoạt VIP đúng thời hạn.</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`${filter === f.id ? 'btn-primary' : 'btn-ghost'} px-2.5 py-1 text-xs`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
        <button type="button" className="btn-ghost px-2.5 py-1 text-xs" onClick={() => void reload()} data-testid="vip-orders-reload">↻ Tải lại</button>
      </div>
      {err && <div className="mt-2"><Alert>{err}</Alert></div>}
      {!orders && !err ? (
        <Spinner />
      ) : (
        <ul className="mt-3 space-y-2">
          {shown.map((o) => {
            const open = o.status === 'pending' || o.status === 'submitted'
            return (
              <li key={o.id} className="card space-y-1.5 p-3 text-sm" data-testid="vip-order-row">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="font-bold">{o.id}</code>
                  <span className="text-xs font-semibold">{VIP_ORDER_STATUS_LABEL[o.status]}</span>
                </div>
                <div className="truncate">{o.email}</div>
                <div className="text-xs text-slate-500">
                  VIP {o.months} tháng · <b>{formatVND(o.amount)}</b> · tạo {o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : ''}
                  {o.submittedAt ? ` · gửi bằng chứng ${new Date(o.submittedAt).toLocaleString('vi-VN')}` : ''}
                </div>
                <div className="text-xs text-slate-500">Tài khoản nhận: {bankByBin(o.bank.bin)?.short || o.bank.bin} {o.bank.accountNo} – {o.bank.accountName}</div>
                {o.decidedAt && <div className="text-xs text-slate-500">Xử lý lúc {new Date(o.decidedAt).toLocaleString('vi-VN')}{o.vipExpiresAt ? ` · VIP đến ${new Date(o.vipExpiresAt).toLocaleDateString('vi-VN')}` : ''}{o.rejectReason ? ` · ${o.rejectReason}` : ''}</div>}
                {o.proof && <button type="button" className="text-xs font-semibold text-indigo-700" onClick={() => setProof(o)}>Xem bằng chứng</button>}
                {open && (
                  <div className="flex gap-2 pt-1">
                    <button type="button" className="btn-primary flex-1 px-2 py-1 text-xs" disabled={busyId === o.id} onClick={() => act(o, true)} data-testid="vip-approve">Đã nhận tiền – kích hoạt VIP</button>
                    <button type="button" className="btn-ghost px-2 py-1 text-xs text-rose-600" disabled={busyId === o.id} onClick={() => act(o, false)}>Từ chối</button>
                  </div>
                )}
              </li>
            )
          })}
          {!shown.length && <li className="py-6 text-center text-slate-500">Không có yêu cầu.</li>}
        </ul>
      )}
      <Modal open={!!proof} onClose={() => setProof(null)} title={`Bằng chứng ${proof?.id || ''}`}>
        {proof?.proof.startsWith('data:image/') ? (
          <img src={proof.proof} alt="Bằng chứng chuyển khoản" className="mx-auto max-h-[70vh] rounded" />
        ) : (
          <a href={proof?.proof} target="_blank" rel="noreferrer" className="break-all text-indigo-700">{proof?.proof}</a>
        )}
      </Modal>
    </section>
  )
}
