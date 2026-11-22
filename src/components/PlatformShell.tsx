import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { logout } from '../auth/actions'
import { PlatformFooter } from './Footer'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-extrabold text-slate-900">
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <span>
        VHP <span className="text-indigo-600">Shop</span>
      </span>
    </Link>
  )
}

export function PlatformShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const { user, isPlatformAdmin } = useAuth()
  const nav = useNavigate()
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className={`mx-auto flex h-14 items-center justify-between gap-2 px-4 ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}>
          <Logo />
          <nav className="flex items-center gap-2 text-sm">
            {isPlatformAdmin && (
              <Link to="/quan-tri" className="hidden rounded-lg px-2 py-1 font-semibold text-amber-700 hover:bg-amber-50 sm:inline">
                Quản trị
              </Link>
            )}
            {user ? (
              <>
                <Link to="/quan-ly" className="btn-ghost px-3 py-1.5">
                  Cửa hàng của tôi
                </Link>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-100"
                  onClick={async () => {
                    await logout()
                    nav('/')
                  }}
                >
                  Thoát
                </button>
              </>
            ) : (
              <>
                <Link to="/dang-nhap" className="rounded-lg px-2 py-1.5 font-medium text-slate-700 hover:bg-slate-100">
                  Đăng nhập
                </Link>
                <Link to="/dang-ky" className="btn-primary px-3 py-1.5">
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <PlatformFooter />
    </div>
  )
}
