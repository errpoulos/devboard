import { NavLink, useNavigate } from 'react-router'
import { Ticket, Users, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/api/axios'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()
  const isAgent = user?.role === 'agent' || user?.role === 'administrator'
  const isAdmin = user?.role === 'administrator'

  async function handleSignOut() {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore errors
    }
    setUser(null)
    navigate('/login', { replace: true })
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-[450] transition-colors',
      isActive
        ? 'bg-[#1a1b1e] text-porcelain'
        : 'text-storm-cloud hover:text-porcelain hover:bg-[#141516]',
    ].join(' ')

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="w-[240px] flex-shrink-0 flex flex-col"
        style={{ background: '#0a0b0c', borderRight: '1px solid #1c1e21' }}
      >
        {/* App name */}
        <div className="px-4 pt-5 pb-4">
          <span className="text-[15px] font-[590] text-porcelain tracking-[-0.15px]">
            Helpdesk
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5">
          <NavLink to="/tickets" className={navLinkClass}>
            <Ticket size={14} strokeWidth={1.8} />
            Tickets
          </NavLink>

          {isAgent && (
            <NavLink to="/customers" className={navLinkClass}>
              <Users size={14} strokeWidth={1.8} />
              Customers
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/settings" className={navLinkClass}>
              <Settings size={14} strokeWidth={1.8} />
              Settings
            </NavLink>
          )}
        </nav>

        {/* User footer */}
        {user && (
          <div className="px-3 py-4 border-t border-[#1c1e21]">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-[600] flex-shrink-0"
                style={{ background: '#5e6ad2', color: '#fff' }}
              >
                {getInitials(user.name)}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-[500] text-porcelain truncate">{user.name}</div>
                <div className="text-[11px] text-storm-cloud truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-[12px] text-storm-cloud hover:text-porcelain hover:bg-[#141516] transition-colors"
            >
              <LogOut size={12} strokeWidth={1.8} />
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 bg-pitch-black">{children}</main>
    </div>
  )
}
