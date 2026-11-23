import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { authErrorMessage, loginEmail, loginGoogle, registerEmail, resetPassword } from '../../auth/actions'
import { NotConfigured } from '../../components/NotConfigured'
import { PlatformShell } from '../../components/PlatformShell'
import { Alert } from '../../components/ui'
import { FreeClosedNotice } from '../../components/PlanBits'
import { usePlatformConfig } from '../../lib/usePlatformConfig'
import { firebaseConfigured } from '../../lib/firebase'
import { applySeo } from '../../lib/seo'

function useNextPath() {
  const [sp] = useSearchParams()
  const next = sp.get('next')
  const mau = sp.get('mau')
  if (next && next.startsWith('/')) return next
  return mau ? `/tao-cua-hang?mau=${mau}` : '/quan-ly'
}

function GoogleButton({ onError }: { onError: (m: string) => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      className="btn-ghost w-full py-2.5"
      onClick={async () => {
        setBusy(true)
        try {
          await loginGoogle()
        } catch (e) {
          onError(authErrorMessage(e))
        } finally {
          setBusy(false)
        }
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      Tiếp tục với Google
    </button>
  )
}

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PlatformShell>
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="card p-6">
          <h1 className="mb-4 text-2xl font-extrabold">{title}</h1>
          {children}
        </div>
      </div>
    </PlatformShell>
  )
}

function useRedirectWhenLoggedIn() {
  const { user } = useAuth()
  const nav = useNavigate()
  const next = useNextPath()
  useEffect(() => {
    if (user) nav(next, { replace: true })
  }, [user, next, nav])
}

export function LoginPage() {
  useRedirectWhenLoggedIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sp] = useSearchParams()
  useEffect(() => applySeo({ title: 'Đăng nhập – VHP Shop', description: 'Đăng nhập để quản lý cửa hàng online của bạn trên VHP Shop.' }), [])
  if (!firebaseConfigured) return <NotConfigured />
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await loginEmail(email, password)
    } catch (e2) {
      setErr(authErrorMessage(e2))
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthCard title="Đăng nhập">
      <form onSubmit={submit} className="space-y-3">
        {err && <Alert>{err}</Alert>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Mật khẩu</label>
          <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
          {busy ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        <div className="text-right text-sm">
          <Link to="/quen-mat-khau" className="text-indigo-600 hover:underline">Quên mật khẩu?</Link>
        </div>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />hoặc<span className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleButton onError={setErr} />
      <p className="mt-5 text-center text-sm text-slate-600">
        Chưa có tài khoản?{' '}
        <Link to={`/dang-ky?${sp.toString()}`} className="font-semibold text-indigo-600 hover:underline">Đăng ký miễn phí</Link>
      </p>
    </AuthCard>
  )
}

export function RegisterPage() {
  useRedirectWhenLoggedIn()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sp] = useSearchParams()
  useEffect(() => applySeo({ title: 'Đăng ký – VHP Shop', description: 'Đăng ký miễn phí và tạo website bán hàng riêng của bạn trong 2 phút.' }), [])
  const { settings } = usePlatformConfig()
  if (!firebaseConfigured) return <NotConfigured />
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    if (password !== password2) return setErr('Mật khẩu nhập lại không khớp.')
    setBusy(true)
    try {
      await registerEmail(name, email, password)
    } catch (e2) {
      setErr(authErrorMessage(e2))
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthCard title="Tạo tài khoản">
      {settings && !settings.freeMode && (
        <div className="mb-4">
          <Alert kind="warn">
            <FreeClosedNotice />
            <p className="mt-1 text-xs">Bạn vẫn có thể tạo tài khoản; cửa hàng chỉ tạo được sau khi quản trị kích hoạt VIP.</p>
          </Alert>
        </div>
      )}
      <form onSubmit={submit} className="space-y-3">
        {err && <Alert>{err}</Alert>}
        <div>
          <label className="label" htmlFor="name">Họ tên</label>
          <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Mật khẩu (ít nhất 6 ký tự)</label>
          <input id="password" type="password" minLength={6} className="field" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="password2">Nhập lại mật khẩu</label>
          <input id="password2" type="password" minLength={6} className="field" value={password2} onChange={(e) => setPassword2(e.target.value)} required autoComplete="new-password" />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
          {busy ? 'Đang tạo tài khoản...' : 'Đăng ký'}
        </button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />hoặc<span className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleButton onError={setErr} />
      <p className="mt-5 text-center text-sm text-slate-600">
        Đã có tài khoản?{' '}
        <Link to={`/dang-nhap?${sp.toString()}`} className="font-semibold text-indigo-600 hover:underline">Đăng nhập</Link>
      </p>
    </AuthCard>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  if (!firebaseConfigured) return <NotConfigured />
  return (
    <AuthCard title="Quên mật khẩu">
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault()
          setErr('')
          setMsg('')
          try {
            await resetPassword(email)
            setMsg('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (cả mục Spam).')
          } catch (e2) {
            setErr(authErrorMessage(e2))
          }
        }}
      >
        {err && <Alert>{err}</Alert>}
        {msg && <Alert kind="success">{msg}</Alert>}
        <div>
          <label className="label" htmlFor="email">Email đã đăng ký</label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary w-full py-2.5">Gửi email đặt lại</button>
        <p className="text-center text-sm">
          <Link to="/dang-nhap" className="text-indigo-600 hover:underline">Quay lại đăng nhập</Link>
        </p>
      </form>
    </AuthCard>
  )
}
