import { Link } from 'react-router-dom'
import { PLATFORM_ADMIN_ZALO } from '../lib/env'
import { formatLimit, PLAN_LABEL } from '../lib/plans'
import type { Plan, PlansConfig } from '../lib/types'
import { zaloLink } from '../lib/zalo'

export function AdminZaloLink({ className = 'font-semibold underline' }: { className?: string }) {
  return (
    <a href={zaloLink(PLATFORM_ADMIN_ZALO)} target="_blank" rel="noreferrer" className={className}>
      Zalo {PLATFORM_ADMIN_ZALO}
    </a>
  )
}

export function UpgradeVipLink({ className = 'font-semibold text-indigo-700 underline' }: { className?: string }) {
  return (
    <Link to="/nang-cap-vip" className={className} data-testid="upgrade-vip-link">
      👑 Nâng cấp VIP bằng chuyển khoản
    </Link>
  )
}

export function FreeClosedNotice() {
  return (
    <p data-testid="free-closed">
      Hiện chỉ mở đăng ký VIP — liên hệ quản trị qua <AdminZaloLink />
    </p>
  )
}

export function PlanBadge({ plan, vipExpiresAt }: { plan: Plan; vipExpiresAt?: number }) {
  return (
    <span
      data-testid="plan-badge"
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${plan === 'vip' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}
    >
      {plan === 'vip' ? '👑' : '🆓'} Gói {PLAN_LABEL[plan]}
      {plan === 'vip' && vipExpiresAt ? <span className="font-normal">· hạn {new Date(vipExpiresAt).toLocaleDateString('vi-VN')}</span> : null}
    </span>
  )
}

function templateText(n: number | undefined) {
  if (n === undefined) return '—'
  return n <= 1 ? '1 giao diện (khoá sau khi chọn)' : `${n} giao diện, đổi bất cứ lúc nào`
}

export function PlanComparison({ plans }: { plans: PlansConfig | null }) {
  const rows: [string, string, string][] = [
    ['Giao diện', templateText(plans?.free.maxTemplates), templateText(plans?.vip.maxTemplates)],
    ['Sản phẩm', formatLimit(plans?.free.maxProducts, 'sản phẩm'), formatLimit(plans?.vip.maxProducts, 'sản phẩm')],
    ['Giá', '0đ', 'Liên hệ quản trị'],
  ]
  return (
    <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-lg" data-testid="plan-comparison">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase">
            <th className="px-3 py-2 font-semibold text-slate-500">So sánh gói</th>
            <th className="px-3 py-2 font-bold">🆓 Thường</th>
            <th className="px-3 py-2 font-bold text-amber-700">👑 VIP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, a, b]) => (
            <tr key={k} className="border-t border-slate-100 align-top">
              <td className="px-3 py-2 font-semibold text-slate-600">{k}</td>
              <td className="px-3 py-2">{a}</td>
              <td className="px-3 py-2">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-600">
        Nâng VIP: liên hệ quản trị qua <AdminZaloLink className="font-semibold text-indigo-700" /> hoặc <UpgradeVipLink className="font-semibold text-indigo-700" />
      </p>
    </div>
  )
}
