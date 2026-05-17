import { Outlet, Link, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { logout } from '@/features/auth/api'

export default function DashboardLayout() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null)
      navigate('/login')
    },
  })

  return (
    <div className="min-h-screen bg-pitch-black">
      <header className="border-b border-charcoal-grey bg-graphite px-6 h-12 flex items-center justify-between sticky top-0 z-40">
        <Link
          to="/workspaces"
          className="text-[15px] font-[590] text-porcelain tracking-[-0.13px] hover:text-neon-lime transition-colors"
        >
          DevBoard
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-storm-cloud tracking-[-0.13px]">{user?.name}</span>
          <button
            className="text-[13px] text-storm-cloud hover:text-porcelain transition-colors tracking-[-0.13px] disabled:opacity-40"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
