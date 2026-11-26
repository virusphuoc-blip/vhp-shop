import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { useAuth } from '../../auth/AuthContext'
import { PlatformShell } from '../../components/PlatformShell'
import { AdminZaloLink, PlanBadge } from '../../components/PlanBits'
import { Alert, Spinner } from '../../components/ui'
import { bankByBin } from '../../lib/banks'
import { cancelVipOrder, createVipOrder, getPaymentConfig, submitVipProof, watchMyVipOrders } from '../../lib/db'
import { compressImage, isImageUrl } from '../../lib/image'
import { formatVND } from '../../lib/money'
import { effectivePlan, paymentReady, termPrice, VIP_ORDER_STATUS_LABEL, VIP_TERMS } from '../../lib/plans'
import { applySeo } from '../../lib/seo'
import type { PaymentConfig, VipOrder, VipTerm } from '../../lib/types'
import { buildVietQRPayload } from '../../lib/vietqr'

const PROOF_LIMIT = { maxDim: 1000, maxKB: 200 }

function bankLabel(bin: string) {
  return bankByBin(bin)?.short || bin
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" className="shrink-0 rounded border border-slate-300 px-2 py-0.5 text-xs font-semibold" onClick={() => navigator.clipboard?.writeText(text).then(() => setDone(true), () => {})}>
      {done ? 'Đã chép' : 'Sao chép'}
    </button>
  )
}

function PayPanel({ order, cfg }: { order: VipOrder; cfg: PaymentConfig | null }) {
  const [qr, setQr] = useState('')
  const [link, setLink] = useState('')
  const [image, setImage] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const stale = order.status === 'pending' && (!cfg || termPrice(cfg, order.term) !== order.amount || JSON.stringify(cfg.bank) !== JSON.stringify(order.bank))
  useEffect(() => {
    QRCode.toDataURL(buildVietQRPayload(order.bank.bin, order.bank.accountNo, order.amount, order.id), { width: 320, margin: 1, errorCorrectionLevel: 'M' }).then(setQr, () => setQr(''))
  }, [order])
  const pick = async (f: File | undefined) => {
    if (!f) return
    setErr('')
    try {
      setImage(await compressImage(f, PROOF_LIMIT))
    } catch (e) {
      setErr((e as Error).message)
    }
  }
  const submit = async () => {
    setErr('')
    const proof = image || link.trim()
    if (!proof) return setErr('Hãy dán link ảnh chụp hoặc tải ảnh chụp màn hình giao dịch.')
    if (!image && !isImageUrl(proof)) return setErr('Link bằng chứng phải bắt đầu bằng https://')
    setBusy(true)
    try {
      await submitVipProof(order.id, proof)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const cancel = async () => {
    if (!confirm(`Huỷ đơn ${order.id}?`)) return
    try {
      await cancelVipOrder(order.id)
    } catch (e) {
      setErr((e as Error).message)
    }
  }
  const rows: [string, string, boolean][] = [
    ['Ngân hàng', bankLabel(order.bank.bin), false],
    ['Số tài khoản', order.bank.accountNo, true],
    ['Chủ tài khoản', order.bank.accountName, false],
    ['Số tiền', formatVND(order.amount), false],
    ['Nội dung', order.id, true],
  ]
  return (
    <section className="card space-y-3" data-testid="vip-pay">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold">VIP {order.months} tháng · {formatVND(order.amount)}</h2>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800" data-testid="vip-order-status">{VIP_ORDER_STATUS_LABEL[order.status]}</span>
      </div>
      {stale && <Alert kind="warn">Giá hoặc tài khoản nhận tiền vừa được quản trị thay đổi. Hãy huỷ đơn này và tạo đơn mới.</Alert>}
      {qr && <img src={qr} alt="Mã VietQR nâng cấp VIP" className="mx-auto w-60 rounded bg-white p-2" data-testid="vip-qr" />}
      <p className="text-center text-xs text-slate-500">Mở app ngân hàng → Quét QR. Số tiền và nội dung đã điền sẵn — giữ nguyên nội dung <b>{order.id}</b> để đối soát.</p>
      <dl className="space-y-1.5 text-sm">
        {rows.map(([k, v, copy]) => (
          <div key={k} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
            <dt className="text-slate-500">{k}</dt>
            <dd className="flex items-center gap-2 text-right font-semibold" data-testid={`vip-pay-${k}`}>
              {v}
              {copy && <CopyBtn text={v} />}
            </dd>
          </div>
        ))}
      </dl>
      {order.status === 'pending' ? (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-semibold">Sau khi chuyển khoản, gửi bằng chứng để quản trị xác nhận:</p>
          <input type="url" className="field" placeholder="Dán link ảnh chụp giao dịch (https://...)" value={link} onChange={(e) => setLink(e.target.value)} aria-label="Link bằng chứng" disabled={!!image} />
          <label className="block text-sm">
            <span className="text-slate-600">hoặc tải ảnh chụp màn hình (tối đa {PROOF_LIMIT.maxKB} KB sau khi nén)</span>
            <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => pick(e.target.files?.[0])} data-testid="vip-proof-file" />
          </label>
          {image && (
            <div className="flex items-center gap-2">
              <img src={image} alt="Ảnh bằng chứng" className="h-20 rounded border" />
              <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setImage('')}>Bỏ ảnh</button>
            </div>
          )}
          {err && <Alert>{err}</Alert>}
          <button type="button" className="btn-primary w-full" disabled={busy || stale} onClick={submit} data-testid="vip-submit">
            {busy ? 'Đang gửi…' : 'Tôi đã chuyển khoản'}
          </button>
          <button type="button" className="w-full text-sm text-rose-600" onClick={cancel}>Huỷ đơn</button>
        </div>
      ) : (
        <Alert kind="info">
          Đã gửi bằng chứng. Quản trị sẽ đối soát và kích hoạt VIP — trang này tự cập nhật khi xong. Cần gấp: <AdminZaloLink />
        </Alert>
      )}
    </section>
  )
}

export default function UpgradeVip() {
  const { user, account, refreshAccount } = useAuth()
  const [cfg, setCfg] = useState<PaymentConfig | null | undefined>(undefined)
  const [orders, setOrders] = useState<VipOrder[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<VipTerm | ''>('')
  const [now] = useState(() => Date.now())
  useEffect(() => applySeo({ title: 'Nâng cấp VIP – VHP Shop', description: 'Nâng cấp tài khoản VHP Shop lên VIP bằng chuyển khoản VietQR.' }), [])
  useEffect(() => {
    getPaymentConfig().then(setCfg, () => setCfg(null))
  }, [])
  useEffect(() => {
    if (!user) return
    return watchMyVipOrders(user.uid, setOrders, (e) => setErr(e.message))
  }, [user])
  const approvedKey = useMemo(() => (orders || []).filter((o) => o.status === 'approved').map((o) => o.id).join(','), [orders])
  useEffect(() => {
    if (approvedKey) void refreshAccount()
  }, [approvedKey, refreshAccount])

  const open = (orders || []).find((o) => o.status === 'pending' || o.status === 'submitted')
  const plan = effectivePlan(account, now)
  const ready = paymentReady(cfg ?? null)

  const buy = async (term: VipTerm) => {
    if (!user || !cfg) return
    setErr('')
    setBusy(term)
    try {
      await createVipOrder(user, cfg, term)
    } catch (e) {
      const code = (e as { code?: string }).code
      setErr(code === 'permission-denied' ? 'Giá hoặc tài khoản nhận tiền vừa thay đổi — tải lại trang rồi thử lại.' : (e as Error).message)
    } finally {
      setBusy('')
    }
  }

  return (
    <PlatformShell>
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-extrabold">Nâng cấp VIP</h1>
          <PlanBadge plan={plan} vipExpiresAt={account?.vipExpiresAt} />
        </div>
        <p className="text-sm text-slate-600">VIP dùng được cả 32 giao diện, đổi giao diện bất cứ lúc nào và không giới hạn sản phẩm. Nếu đang là VIP, thời hạn mua thêm được cộng dồn.</p>
        {err && <Alert>{err}</Alert>}
        {cfg === undefined || orders === null ? (
          <Spinner />
        ) : open ? (
          <PayPanel order={open} cfg={cfg} />
        ) : !ready ? (
          <Alert kind="warn">
            <span data-testid="vip-not-ready">Chưa mở nâng cấp VIP qua chuyển khoản — liên hệ quản trị qua <AdminZaloLink />.</span>
          </Alert>
        ) : (
          <section className="grid grid-cols-2 gap-3" data-testid="vip-terms">
            {VIP_TERMS.map(({ term, months }) => {
              const price = termPrice(cfg, term)
              return (
                <div key={term} className="card flex flex-col gap-2 p-3 text-center" data-testid={`vip-term-${term}`}>
                  <div className="text-lg font-extrabold">{months} tháng</div>
                  {price ? (
                    <>
                      <div className="font-semibold text-amber-700">{formatVND(price)}</div>
                      <button type="button" className="btn-primary mt-auto" disabled={!!busy} onClick={() => buy(term)}>
                        {busy === term ? 'Đang tạo…' : 'Chọn'}
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">Chưa mở bán — liên hệ quản trị qua <AdminZaloLink className="font-semibold text-indigo-700" /></p>
                  )}
                </div>
              )
            })}
          </section>
        )}

        {!!orders?.length && (
          <section className="card" data-testid="vip-history">
            <h2 className="font-bold">Lịch sử giao dịch</h2>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {orders.map((o) => (
                <li key={o.id} className="py-2">
                  <div className="flex justify-between gap-2">
                    <code className="font-semibold">{o.id}</code>
                    <span className={o.status === 'approved' ? 'font-semibold text-emerald-700' : o.status === 'rejected' ? 'text-rose-600' : 'text-slate-600'}>{VIP_ORDER_STATUS_LABEL[o.status]}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    VIP {o.months} tháng · {formatVND(o.amount)} · {o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : ''} · nhận: {bankLabel(o.bank.bin)} {o.bank.accountNo}
                  </div>
                  {o.status === 'approved' && o.vipExpiresAt && <div className="text-xs text-emerald-700">VIP đến {new Date(o.vipExpiresAt).toLocaleDateString('vi-VN')}</div>}
                  {o.status === 'rejected' && o.rejectReason && <div className="text-xs text-rose-600">Lý do: {o.rejectReason}</div>}
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className="text-center text-sm"><Link to="/quan-ly" className="text-indigo-700">← Về cửa hàng của tôi</Link></p>
      </div>
    </PlatformShell>
  )
}
