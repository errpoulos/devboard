import { Navigate, Route, Routes } from 'react-router'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import TicketsPage from '@/pages/TicketsPage'
import TicketDetailPage from '@/pages/TicketDetailPage'
import NewTicketPage from '@/pages/NewTicketPage'
import SettingsPage from '@/pages/SettingsPage'
import CustomersPage from '@/pages/CustomersPage'
import CustomerDetailPage from '@/pages/CustomerDetailPage'
import AppLayout from '@/components/AppLayout'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function Wrapped({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppLayout>{children}</AppLayout>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/tickets" element={<Wrapped><TicketsPage /></Wrapped>} />
      <Route path="/tickets/new" element={<Wrapped><NewTicketPage /></Wrapped>} />
      <Route path="/tickets/:id" element={<Wrapped><TicketDetailPage /></Wrapped>} />
      <Route path="/customers" element={<Wrapped><CustomersPage /></Wrapped>} />
      <Route path="/customers/:id" element={<Wrapped><CustomerDetailPage /></Wrapped>} />
      <Route path="/settings" element={<Wrapped><SettingsPage /></Wrapped>} />
      <Route path="*" element={<Navigate to="/tickets" replace />} />
    </Routes>
  )
}
