import { Link } from 'react-router-dom'
import { PlatformShell } from '../../components/PlatformShell'

export default function NotFound() {
  return (
    <PlatformShell>
      <div className="px-4 py-20 text-center">
        <div className="text-5xl">🔎</div>
        <h1 className="mt-3 text-2xl font-bold">Không tìm thấy trang</h1>
        <Link to="/" className="btn-primary mt-6">
          Về trang chủ
        </Link>
      </div>
    </PlatformShell>
  )
}
