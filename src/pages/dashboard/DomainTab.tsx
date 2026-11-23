import { useState, type FormEvent } from 'react'
import { Alert } from '../../components/ui'
import { setCustomDomain, setDomainStatus } from '../../lib/db'
import { checkDomain, requiredRecords } from '../../lib/dns'
import { PLATFORM_ADMIN_EMAIL, ROOT_DOMAIN } from '../../lib/env'
import { normalizeDomain } from '../../lib/slug'
import type { DomainStatus } from '../../lib/types'
import { pathStoreLabel, pathStoreUrl } from '../../lib/urls'
import { useDash } from './DashContext'

const STATUS: Record<DomainStatus, { label: string; cls: string; desc: string }> = {
  none: { label: 'Chưa trỏ', cls: 'bg-slate-200 text-slate-700', desc: 'Chưa thấy bản ghi DNS đúng. Hãy thêm bản ghi bên dưới tại nơi bạn mua tên miền.' },
  pending: { label: 'Đang chờ', cls: 'bg-amber-100 text-amber-800', desc: 'DNS đã trỏ đúng. Đang chờ quản trị VHP Shop gắn tên miền & cấp SSL (thường trong 24 giờ).' },
  done: { label: 'Đã xong', cls: 'bg-emerald-100 text-emerald-800', desc: 'Tên miền đã hoạt động với HTTPS.' },
}

export default function DomainTab() {
  const { store, setStore } = useDash()
  const [input, setInput] = useState(store.customDomain)
  const [msg, setMsg] = useState<{ kind: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState('')

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const d = normalizeDomain(input)
    if (d && (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d) || d.endsWith(`.${ROOT_DOMAIN}`) || d === ROOT_DOMAIN)) return setMsg({ kind: 'error', text: 'Tên miền không hợp lệ.' })
    setBusy(true)
    try {
      await setCustomDomain(store, d)
      setStore({ ...store, customDomain: d, domainStatus: 'none' })
      setInput(d)
      setDetail('')
      setMsg({ kind: 'success', text: d ? 'Đã lưu tên miền. Hãy thêm bản ghi DNS bên dưới.' : 'Đã gỡ tên miền riêng.' })
    } catch (e2) {
      setMsg({ kind: 'error', text: (e2 as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    setMsg(null)
    setBusy(true)
    try {
      const r = await checkDomain(store.customDomain)
      setDetail(r.detail)
      if (r.status !== store.domainStatus) {
        await setDomainStatus(store.id, r.status)
        setStore({ ...store, domainStatus: r.status })
      }
    } catch {
      setMsg({ kind: 'error', text: 'Không kiểm tra được DNS, vui lòng thử lại.' })
    } finally {
      setBusy(false)
    }
  }

  const records = store.customDomain ? requiredRecords(store.customDomain) : []
  const st = STATUS[store.domainStatus]
  return (
    <div className="space-y-4">
      <div className="card text-sm">
        Địa chỉ miễn phí của bạn: <a href={pathStoreUrl(store.slug)} target="_blank" rel="noreferrer" className="break-all font-semibold text-indigo-700" data-testid="free-address">{pathStoreLabel(store.slug)}</a> (luôn hoạt động)
      </div>
      <div className="card text-sm text-slate-600" data-testid="subdomain-contact">
        Muốn dùng địa chỉ dạng ten-shop.{ROOT_DOMAIN}? Liên hệ quản trị viên để được cấp subdomain:{' '}
        <a href={`mailto:${PLATFORM_ADMIN_EMAIL}`} className="break-all font-semibold text-indigo-700">{PLATFORM_ADMIN_EMAIL}</a>
      </div>
      <form onSubmit={save} className="card space-y-3">
        <h2 className="font-bold">Tên miền riêng</h2>
        <label className="label" htmlFor="domain">Tên miền bạn đã mua</label>
        <div className="flex gap-2">
          <input id="domain" className="field" placeholder="vd: shopcuaban.vn hoặc www.shopcuaban.vn" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn-primary shrink-0" disabled={busy}>Lưu</button>
        </div>
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      </form>
      {store.customDomain && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold break-all">{store.customDomain}</h2>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`} data-testid="domain-status">{st.label}</span>
          </div>
          <p className="text-sm text-slate-600">{st.desc}</p>
          <div>
            <div className="mb-1 text-sm font-semibold">Bản ghi DNS cần thêm</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr><th className="p-2">Loại</th><th className="p-2">Tên / Host</th><th className="p-2">Giá trị / Trỏ về</th></tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.type + r.host} className="border-t border-slate-100 font-mono">
                      <td className="p-2 font-bold">{r.type}</td>
                      <td className="p-2">{r.host}</td>
                      <td className="p-2 break-all">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">TTL: để mặc định (Auto / 3600). Xoá các bản ghi A/CNAME cũ trùng tên trước khi thêm. DNS có thể mất 5 phút – 24 giờ để cập nhật.</p>
          </div>
          <button type="button" className="btn-ghost w-full" onClick={verify} disabled={busy}>{busy ? 'Đang kiểm tra...' : 'Kiểm tra lại DNS'}</button>
          {detail && <p className="text-xs break-all text-slate-500">{detail}</p>}
        </div>
      )}
    </div>
  )
}
