import { Navigate, Route, Routes } from 'react-router'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/pages/LoginPage'
import TicketsPage from '@/pages/TicketsPage'
import TicketDetailPage from '@/pages/TicketDetailPage'
import NewTicketPage from '@/pages/NewTicketPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/tickets"
        element={
          <RequireAuth>
            <TicketsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tickets/new"
        element={
          <RequireAuth>
            <NewTicketPage />
          </RequireAuth>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <RequireAuth>
            <TicketDetailPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/tickets" replace />} />
    </Routes>
  )
}
