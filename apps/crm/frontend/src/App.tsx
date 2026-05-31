import { Routes, Route, Navigate } from 'react-router'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/pages/LoginPage'
import ContactsPage from '@/pages/ContactsPage'
import ContactDetailPage from '@/pages/ContactDetailPage'
import CompaniesPage from '@/pages/CompaniesPage'
import CompanyDetailPage from '@/pages/CompanyDetailPage'
import PipelinePage from '@/pages/PipelinePage'
import SettingsPage from '@/pages/SettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  return (
    <div className="min-h-screen bg-[#08090a] flex">
      <aside className="w-52 border-r border-[#23252a] flex flex-col py-4 px-3 gap-1 shrink-0">
        <p className="text-[11px] text-[#8a8f98] uppercase tracking-wider px-2 mb-2">CRM</p>
        <NavItem href="/contacts" label="Contacts" />
        <NavItem href="/companies" label="Companies" />
        <NavItem href="/pipeline" label="Pipeline" />
        {user?.is_super_admin && <NavItem href="/settings" label="Settings" />}
        <div className="mt-auto pt-4 border-t border-[#23252a]">
          <p className="text-[12px] text-[#8a8f98] px-2 truncate">{user?.email}</p>
          <button
            onClick={() => setUser(null)}
            className="text-[12px] text-[#8a8f98] hover:text-[#f7f8f8] px-2 mt-1"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  )
}

function NavItem({ href, label }: { href: string; label: string }) {
  const active = window.location.pathname === href
  return (
    <a
      href={href}
      className={`text-[13px] px-2 py-1.5 rounded ${active ? 'bg-[#23252a] text-[#f7f8f8]' : 'text-[#8a8f98] hover:text-[#f7f8f8]'}`}
    >
      {label}
    </a>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route index element={<Navigate to="/contacts" replace />} />
                <Route path="contacts" element={<ContactsPage />} />
                <Route path="contacts/:id" element={<ContactDetailPage />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="companies/:id" element={<CompanyDetailPage />} />
                <Route path="pipeline" element={<PipelinePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  )
}
