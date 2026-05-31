import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { logout } from '@/features/auth/api'
import { cn } from '@/lib/utils'

function NavItem({
  to,
  icon,
  label,
  collapsed,
}: {
  to: string
  icon: React.ReactNode
  label: string
  collapsed: boolean
}) {
  const { pathname } = useLocation()
  const active = pathname === to || pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] tracking-[-0.13px] transition-colors',
        collapsed ? 'justify-center' : '',
        active
          ? 'bg-charcoal-grey text-porcelain'
          : 'text-storm-cloud hover:text-porcelain hover:bg-charcoal-grey/60',
      )}
      style={{ borderRadius: '2px' }}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

const WorkspacesIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const ImportIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
)

const DashboardIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
)

export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null)
      navigate('/login')
    },
  })

  return (
    <div className="flex min-h-screen bg-pitch-black">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-charcoal-grey shrink-0 transition-all duration-200',
          collapsed ? 'w-12' : 'w-52',
        )}
        style={{ background: '#0f1011' }}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-12 border-b border-charcoal-grey px-3', collapsed && 'justify-center')}>
          {collapsed ? (
            <Link to="/workspaces" title="DevBoard" className="text-neon-lime font-[590] text-[15px]">
              D
            </Link>
          ) : (
            <Link
              to="/workspaces"
              className="text-[15px] font-[590] text-porcelain tracking-[-0.13px] hover:text-neon-lime transition-colors"
            >
              DevBoard
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          <NavItem
            to="/workspaces"
            icon={<WorkspacesIcon />}
            label="Workspaces"
            collapsed={collapsed}
          />
          <NavItem
            to="/dashboard"
            icon={<DashboardIcon />}
            label="Dashboard"
            collapsed={collapsed}
          />
          <NavItem
            to="/import"
            icon={<ImportIcon />}
            label="Import"
            collapsed={collapsed}
          />
          {user?.is_super_admin && (
            <NavItem
              to="/settings"
              icon={<SettingsIcon />}
              label="Settings"
              collapsed={collapsed}
            />
          )}
        </nav>

        {/* Footer */}
        <div className={cn('p-2 border-t border-charcoal-grey space-y-0.5', collapsed && 'flex flex-col items-center')}>
          {!collapsed && (
            <div className="px-2 py-1.5 text-[12px] text-fog-grey tracking-[-0.1px] truncate">
              {user?.name}
            </div>
          )}
          <button
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 w-full text-[12px] text-fog-grey hover:text-storm-cloud transition-colors tracking-[-0.1px]',
              collapsed && 'justify-center',
            )}
            style={{ borderRadius: '2px' }}
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            title={collapsed ? 'Sign out' : undefined}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && 'Sign out'}
          </button>

          <button
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 w-full text-[12px] text-fog-grey hover:text-storm-cloud transition-colors',
              collapsed && 'justify-center',
            )}
            style={{ borderRadius: '2px' }}
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CollapseIcon collapsed={collapsed} />
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
