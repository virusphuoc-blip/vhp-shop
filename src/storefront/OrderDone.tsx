import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { bankByBin } from '../lib/banks'
import { formatVND } from '../lib/money'
import { buildVietQRPayload, sanitizeTransferNote } from '../lib/vietqr'
import { zaloLink } from '../lib/zalo'
import type { OrderDoneState } from './Checkout'
import { useStore } from './StoreContext'

function CopyButton({ text, label = 'Sao chép' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="shrink-0 rounded border border-sborder px-2 py-0.5 text-xs font-semibold"
      onClick={() => navigator.clipboard?.writeText(text).then(() => setDone(true), () => {})}
    >
      {done ? 'Đã chép' : label}
    </button>
  )
}

function BankTransfer({ orderId, total }: { orderId: string; total: number }) {
  const { store } = useStore()
  const [qr, setQr] = useState('')
  const memo = sanitizeTransferNote(`DH ${orderId}`)
  const bank = bankByBin(store.bank.bin)
  useEffect(() => {
    const payload = buildVietQRPayload(store.bank.bin, store.bank.accountNo, total, memo)
    QRCode.toDataURL(payload, { width: 320, margin: 1, errorCorrectionLevel: 'M' }).then(setQr, () => setQr(''))
  }, [store.bank, total, memo])
  const rows: [string, string][] = [
    ['Ngân hàng', bank ? bank.short : store.bank.bin],
    ['Số tài khoản', store.bank.accountNo],
    ['Chủ tài khoản', store.bank.accountName],
    ['Số tiền', formatVND(total)],
    ['Nội dung', memo],
  ]
  return (
    <div className="mt-6 rounded-s border border-sborder bg-ssurf p-4 text-left">
      <h2 className="text-center font-bold">Quét mã VietQR để thanh toán</h2>
      {qr && <img src={qr} alt="Mã VietQR thanh toán đơn hàng" className="mx-auto mt-3 w-60 rounded bg-white p-2" data-testid="vietqr" />}
      <p className="mt-2 text-center text-xs text-smuted">Mở app ngân hàng → Quét QR. Số tiền và nội dung đã được điền sẵn.</p>
      <dl className="mt-3 space-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2 border-b border-sborder pb-1.5">
            <dt className="text-smuted">{k}</dt>
            <dd className="flex items-center gap-2 text-right font-semibold">
              {v}
              {(k === 'Số tài khoản' || k === 'Nội dung') && <CopyButton text={v} />}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function ZaloSend({ text }: { text: string }) {
  const { store } = useStore()
  const [copied, setCopied] = useState(false)
  return (
    <div className="mt-6 rounded-s border border-sborder bg-ssurf p-4 text-left">
      <h2 className="font-bold">Gửi đơn qua Zalo</h2>
      <p className="mt-1 text-sm text-smuted">Nội dung đơn đã được sao chép. Mở Zalo của cửa hàng rồi dán (giữ ô chat → Dán) và gửi.</p>
      <pre className="mt-3 max-h-56 overflow-auto rounded bg-sbg p-2 text-xs whitespace-pre-wrap" data-testid="zalo-text">{text}</pre>
      <a
        href={zaloLink(store.zalo)}
        target="_blank"
        rel="noreferrer"
        data-testid="open-zalo"
        onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true), () => {})}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-s bg-[#0068ff] px-4 py-3 font-bold text-white"
      >
        Mở Zalo & gửi đơn
      </a>
      <div className="mt-2 flex items-center justify-between text-xs text-smuted">
        <span>{copied ? '✓ Đã sao chép nội dung đơn' : 'Bấm nút trên để sao chép & mở Zalo'}</span>
        <CopyButton text={text} label="Chép lại" />
      </div>
    </div>
  )
}

export default function OrderDone() {
  const { orderId = '' } = useParams()
  const { state } = useLocation() as { state: OrderDoneState | null }
  const { link, store, demo } = useStore()
  const s = state && state.orderId === orderId ? state : null
  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <div className="text-5xl">✅</div>
      <h1 className="font-heading mt-3 text-2xl font-bold">Đặt hàng thành công!</h1>
      <p className="mt-2 text-smuted">
        Mã đơn: <b className="text-stext" data-testid="order-id">{orderId}</b>
      </p>
      {demo && <p className="mt-2 text-sm text-sa">Đây là cửa hàng mẫu nên đơn không được gửi đi.</p>}
      {s && <p className="mt-1">Tổng tiền: <b className="text-sp">{formatVND(s.total)}</b></p>}
      <p className="mt-2 text-sm text-smuted">{store.name} sẽ liên hệ với bạn để xác nhận đơn{store.phone ? ` (hotline ${store.phone})` : ''}.</p>
      {s?.payment === 'bank' && <BankTransfer orderId={orderId} total={s.total} />}
      {s?.payment === 'zalo' && <ZaloSend text={s.zaloText} />}
      <Link to={link()} className="s-btn mt-8">Tiếp tục mua sắm</Link>
    </div>
  )
}
