import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlatformShell } from '../../components/PlatformShell'
import { useAuth } from '../../auth/AuthContext'
import { pathStoreLabel } from '../../lib/urls'
import { applySeo } from '../../lib/seo'
import { CATEGORIES, TEMPLATES } from '../../templates'
import { PlanComparison } from '../../components/PlanBits'
import { usePlatformConfig } from '../../lib/usePlatformConfig'

const FEATURES = [
  { icon: '🌐', title: 'Tên miền riêng', text: `Cửa hàng chạy ngay ở ${pathStoreLabel('ten-cua-hang')}, gắn thêm tên miền của bạn khi cần.` },
  { icon: '📦', title: 'Quản lý sản phẩm & đơn', text: 'Thêm sản phẩm, tồn kho, giá cũ – giá mới; theo dõi đơn theo trạng thái.' },
  { icon: '💳', title: 'COD · VietQR · Zalo', text: 'Khách đặt hàng trả tiền khi nhận, quét mã VietQR chuyển khoản hoặc chat Zalo.' },
  { icon: '🏷️', title: 'Mã giảm giá', text: 'Tạo mã giảm theo % hoặc số tiền, đơn tối thiểu, hạn dùng.' },
  { icon: '⭐', title: 'Đánh giá sao', text: 'Khách đánh giá sản phẩm, tăng uy tín cho cửa hàng.' },
  { icon: '📱', title: 'Đẹp trên điện thoại', text: 'Giao diện tối ưu cho màn hình nhỏ, tải nhanh.' },
]

export default function Landing() {
  const { user } = useAuth()
  const { plans } = usePlatformConfig()
  useEffect(() => {
    applySeo({
      title: 'VHP Shop – Tạo website bán hàng riêng miễn phí trong 2 phút',
      description:
        'VHP Shop giúp bạn tự tạo website bán hàng riêng với 32 mẫu giao diện cho 8 ngành hàng: xe máy, đồ chơi, quần áo, cafe, tạp hoá, đồ ăn, điện tử, nội thất. Đặt hàng COD, chuyển khoản VietQR, Zalo.',
    })
  }, [])
  const cta = user ? '/tao-cua-hang' : '/dang-ky'
  return (
    <PlatformShell wide>
      <section className="bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-14 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Dịch vụ website bán hàng cho mọi cửa hàng</p>
          <h1 className="mt-4 text-3xl leading-tight font-extrabold sm:text-5xl">
            Website bán hàng <span className="text-amber-300">của riêng bạn</span> – sẵn sàng trong 2 phút
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
            Chọn mẫu, đặt tên cửa hàng, nhận ngay địa chỉ <b>{pathStoreLabel('ten-cua-hang')}</b>. Khách đặt hàng COD, chuyển khoản VietQR hoặc qua
            Zalo.
          </p>
          <div className="mt-6 max-w-xl">
            <PlanComparison plans={plans} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={cta} className="btn bg-white px-5 py-3 text-base text-indigo-700 hover:bg-indigo-50">
              Tạo cửa hàng miễn phí
            </Link>
            <a href="#mau" className="btn border border-white/40 px-5 py-3 text-base text-white hover:bg-white/10">
              Xem 32 mẫu giao diện
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-2xl font-extrabold">3 bước để mở cửa hàng online</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ['1', 'Đăng ký', 'Bằng email hoặc tài khoản Google.'],
            ['2', 'Chọn mẫu & đặt tên', `Hệ thống tạo địa chỉ miễn phí dạng ${pathStoreLabel('ten-cua-hang')} và kiểm tra trùng tên.`],
            ['3', 'Thêm sản phẩm & bán', 'Chia sẻ link cửa hàng, nhận đơn ngay.'],
          ].map(([n, t, d]) => (
            <li key={n} className="card">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">{n}</div>
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="mau" className="scroll-mt-16 bg-white px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-extrabold">32 mẫu giao diện cho 8 ngành hàng</h2>
          <p className="mt-2 text-center text-slate-600">Mỗi ngành hàng có 4 mẫu với màu sắc, phông chữ và phong cách riêng.</p>
          {CATEGORIES.map((c) => (
          <div key={c.id} className="mt-8" data-testid="landing-category">
          <h3 className="text-lg font-bold">{c.icon} {c.name}</h3>
          <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {TEMPLATES.filter((t) => t.category === c.id).map((t) => (
              <article key={t.id} className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 shadow-sm lg:w-auto">
                <div
                  className="flex h-32 items-center justify-between px-5"
                  style={{ background: `linear-gradient(135deg, ${t.palette.bg} 0%, ${t.palette.surface} 55%, ${t.palette.primary} 140%)` }}
                >
                  <div>
                    <div className="text-xs font-semibold uppercase" style={{ color: t.palette.primary }}>
                      Mẫu
                    </div>
                    <div className="text-2xl font-extrabold" style={{ color: t.palette.text, fontFamily: t.headingFont }}>
                      {t.name}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {[t.palette.primary, t.palette.accent, t.palette.bg, t.palette.text].map((c, i) => (
                        <span key={i} className="h-4 w-4 rounded-full border border-black/10" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-5xl">{t.icon}</span>
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-600">{t.tagline}</p>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/mau/${t.id}`} className="btn-ghost flex-1">
                      Xem mẫu
                    </Link>
                    <Link to={`${cta}?mau=${t.id}`} className="btn-primary flex-1">
                      Dùng mẫu này
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-2xl font-extrabold">Đủ công cụ để bán hàng</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-2 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to={cta} className="btn-primary px-6 py-3 text-base">
            Bắt đầu ngay
          </Link>
        </div>
      </section>
    </PlatformShell>
  )
}
