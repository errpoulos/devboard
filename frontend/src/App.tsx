import { Routes, Route, Navigate } from 'react-router'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/pages/LoginPage'
import WorkspacesPage from '@/pages/WorkspacesPage'
import BoardPage from '@/pages/BoardPage'
import ImportPage from '@/pages/ImportPage'
import DashboardPage from '@/pages/DashboardPage'
import DashboardLayout from '@/components/DashboardLayout'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/workspaces" replace />} />
        <Route path="workspaces" element={<WorkspacesPage />} />
        <Route path="workspaces/:workspaceId/boards/:boardId" element={<BoardPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}
