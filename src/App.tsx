import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { Spinner } from './components/ui'
import { APP_HOSTS, ROOT_DOMAIN } from './lib/env'
import { resolveHost } from './lib/host'
import Landing from './pages/platform/Landing'
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/platform/AuthPages'
import NotFound from './pages/platform/NotFound'
import { DemoStore, DomainStore, SlugStore } from './storefront/StoreLoaders'

const CreateStore = lazy(() => import('./pages/platform/CreateStore'))
const MyStores = lazy(() => import('./pages/platform/MyStores'))
const StoreDashboard = lazy(() => import('./pages/dashboard/StoreDashboard'))
const PlatformAdmin = lazy(() => import('./pages/admin/PlatformAdmin'))

const hostMode = resolveHost(window.location.hostname, { rootDomain: ROOT_DOMAIN, appHosts: APP_HOSTS })

function PlatformRoutes() {
  return (
    <Suspense fallback={<Spinner full />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
        <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
        <Route path="/tao-cua-hang" element={<RequireAuth><CreateStore /></RequireAuth>} />
        <Route path="/quan-ly" element={<RequireAuth><MyStores /></RequireAuth>} />
        <Route path="/quan-ly/:storeId/*" element={<RequireAuth><StoreDashboard /></RequireAuth>} />
        <Route path="/quan-tri/*" element={<PlatformAdmin />} />
        <Route path="/mau/:templateId/*" element={<DemoStore />} />
        <Route path="/s/:slug/*" element={<SlugStore />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {hostMode.kind === 'platform' ? (
          <PlatformRoutes />
        ) : hostMode.kind === 'subdomain' ? (
          <SlugStore slugOverride={hostMode.slug} />
        ) : (
          <DomainStore domain={hostMode.domain} />
        )}
      </AuthProvider>
    </BrowserRouter>
  )
}
