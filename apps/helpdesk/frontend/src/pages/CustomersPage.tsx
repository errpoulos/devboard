import { Link } from 'react-router'
import { useCustomers } from '@/features/tickets/hooks/useTickets'
import { useAuthStore } from '@/store/authStore'
import { Navigate } from 'react-router'

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function CustomersPage() {
  const user = useAuthStore((s) => s.user)
  const isAgent = user?.role === 'agent' || user?.role === 'administrator'

  const { data, isLoading, isError } = useCustomers()

  if (!isAgent) return <Navigate to="/tickets" replace />

  const customers = data?.data ?? []

  return (
    <div className="min-h-screen bg-pitch-black text-porcelain">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-[20px] font-[590] tracking-[-0.2px] mb-6">Customers</h1>

        {isError && (
          <p className="text-[13px] text-warning-red mb-4">Failed to load customers.</p>
        )}

        <div
          className="rounded-md overflow-hidden"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          {isLoading ? (
            <div className="px-4 py-6 text-[13px] text-storm-cloud">Loading customers…</div>
          ) : customers.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-storm-cloud">
              No customers yet.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#23252a]">
                  <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                    Tickets
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[#23252a] last:border-0 hover:bg-[#161718] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/customers/${c.id}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-[600] flex-shrink-0"
                          style={{ background: '#23252a', color: '#8a8f98' }}
                        >
                          {getInitials(c.name)}
                        </div>
                        <span className="text-[13px] text-porcelain group-hover:text-aether-blue transition-colors">
                          {c.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-storm-cloud">{c.email}</td>
                    <td className="px-4 py-3 text-[13px] text-storm-cloud">
                      {c.tickets_count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
