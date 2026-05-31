import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { useCustomer } from '@/features/tickets/hooks/useTickets'
import { useAuthStore } from '@/store/authStore'
import { Navigate } from 'react-router'
import PriorityBadge from '@/features/tickets/components/PriorityBadge'
import TicketStatusBadge from '@/features/tickets/components/TicketStatusBadge'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

const TYPE_LABELS: Record<string, string> = {
  support_request: 'Support',
  bug_report: 'Bug',
  feature_request: 'Feature',
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const isAgent = user?.role === 'agent' || user?.role === 'administrator'

  const { data, isLoading, isError } = useCustomer(Number(id))

  if (!isAgent) return <Navigate to="/tickets" replace />

  const customer = data?.data

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pitch-black text-porcelain">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="text-[13px] text-storm-cloud">Loading…</div>
        </div>
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="min-h-screen bg-pitch-black text-porcelain">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <p className="text-[13px] text-warning-red">Customer not found.</p>
        </div>
      </div>
    )
  }

  const supportNotes = customer.notes?.filter((n) => n.category === 'support') ?? []
  const salesNotes = customer.notes?.filter((n) => n.category === 'sales') ?? []

  return (
    <div className="min-h-screen bg-pitch-black text-porcelain">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-[12px] text-storm-cloud hover:text-porcelain mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to customers
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-[600] flex-shrink-0"
            style={{ background: '#23252a', color: '#8a8f98' }}
          >
            {getInitials(customer.name)}
          </div>
          <div>
            <h1 className="text-[20px] font-[590] tracking-[-0.2px]">{customer.name}</h1>
            <p className="text-[13px] text-storm-cloud mt-0.5">{customer.email}</p>
            {customer.organizations && customer.organizations.length > 0 && (
              <p className="text-[12px] text-fog-grey mt-1">
                {customer.organizations.map((o) => o.name).join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Tickets */}
          <div className="col-span-2 space-y-4">
            <h2 className="text-[14px] font-[510] tracking-[-0.1px]">
              Tickets
              {customer.tickets && customer.tickets.length > 0 && (
                <span className="ml-2 text-[11px] text-storm-cloud font-normal">
                  {customer.tickets.length}
                </span>
              )}
            </h2>

            <div
              className="rounded-md overflow-hidden"
              style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
            >
              {!customer.tickets || customer.tickets.length === 0 ? (
                <div className="px-4 py-5 text-[13px] text-storm-cloud">No tickets yet.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#23252a]">
                      <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                        Subject
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                        Priority
                      </th>
                      <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.tickets.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-[#23252a] last:border-0 hover:bg-[#161718] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            to={`/tickets/${t.id}`}
                            className="text-[13px] text-porcelain hover:text-aether-blue transition-colors"
                          >
                            {t.subject}
                          </Link>
                          {t.type && (
                            <span
                              className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-[500]"
                              style={{ background: '#23252a', color: '#8a8f98' }}
                            >
                              {TYPE_LABELS[t.type] ?? t.type}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <TicketStatusBadge status={t.status} />
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="px-4 py-3 text-[12px] text-storm-cloud">
                          {formatDate(t.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Notes sidebar */}
          <div className="space-y-4">
            {/* Support notes */}
            <div>
              <h2 className="text-[14px] font-[510] tracking-[-0.1px] mb-3">Support Notes</h2>
              <div
                className="rounded-md p-4 space-y-3"
                style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
              >
                {supportNotes.length === 0 ? (
                  <p className="text-[12px] text-storm-cloud">No support notes.</p>
                ) : (
                  supportNotes.map((n) => (
                    <div
                      key={n.id}
                      className="pb-3 border-b border-[#23252a] last:border-0 last:pb-0"
                    >
                      <p className="text-[13px] text-porcelain leading-relaxed">{n.body}</p>
                      <p className="mt-1 text-[11px] text-fog-grey">
                        {n.author?.name ?? 'Unknown'} · {formatDate(n.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sales notes */}
            {salesNotes.length > 0 && (
              <div>
                <h2 className="text-[14px] font-[510] tracking-[-0.1px] mb-3">Sales Notes</h2>
                <div
                  className="rounded-md p-4 space-y-3"
                  style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
                >
                  {salesNotes.map((n) => (
                    <div
                      key={n.id}
                      className="pb-3 border-b border-[#23252a] last:border-0 last:pb-0"
                    >
                      <p className="text-[13px] text-porcelain leading-relaxed">{n.body}</p>
                      <p className="mt-1 text-[11px] text-fog-grey">
                        {n.author?.name ?? 'Unknown'} · {formatDate(n.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
