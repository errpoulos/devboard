import { Outlet, Link, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { logout } from '@/features/auth/api'
import { Button } from '@/components/ui/Button'

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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
        <Link to="/workspaces" className="text-lg font-semibold text-gray-900">
          DevBoard
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Sign out
          </Button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
