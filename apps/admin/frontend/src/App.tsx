import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/pages/LoginPage'
import OrgsPage from '@/pages/OrgsPage'
import OrgDetailPage from '@/pages/OrgDetailPage'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import api from '@/api/axios'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

/** Redirect to /login if not authenticated */
function RequireAuth() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Redirect to /login if authenticated but not a super-admin */
function RequireSuperAdmin() {
  const user = useAuthStore((s) => s.user)
  if (!user?.is_super_admin) return <Navigate to="/login" replace state={{ message: 'Super-admin access required.' }} />
  return <Outlet />
}

function NavBar() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            DevBoard Admin
          </span>
        </div>

        {/* Nav links */}
        <button
          onClick={() => navigate('/orgs')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
          }}
        >
          Organizations
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user.email}</span>
        )}
        <button
          onClick={handleLogout}
          style={{
            padding: '5px 12px',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-default)',
            borderRadius: 6,
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}

function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<RequireSuperAdmin />}>
              <Route element={<AppLayout />}>
                <Route path="/orgs" element={<OrgsPage />} />
                <Route path="/orgs/:id" element={<OrgDetailPage />} />
              </Route>
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/orgs" replace />} />
        </Routes>
      </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
