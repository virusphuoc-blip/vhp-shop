import { Link } from 'react-router-dom'
import { PlatformShell } from './PlatformShell'

export function NotConfigured() {
  return (
    <PlatformShell>
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="card text-center">
          <div className="text-4xl">🛠️</div>
          <h1 className="mt-2 text-xl font-bold">Hệ thống đang được cấu hình</h1>
          <p className="mt-2 text-sm text-slate-600">
            Chức năng đăng ký, đăng nhập và cửa hàng sẽ hoạt động ngay sau khi chủ nền tảng kết nối Firebase. Trong lúc chờ, bạn có thể xem
            trước 32 mẫu giao diện.
          </p>
          <Link to="/#mau" className="btn-primary mt-4">
            Xem các mẫu cửa hàng
          </Link>
        </div>
      </div>
    </PlatformShell>
  )
}
