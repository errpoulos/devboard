import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import PriorityBadge from '@/features/tickets/components/PriorityBadge'
import TicketStatusBadge from '@/features/tickets/components/TicketStatusBadge'
import { TableRowSkeleton } from '@/components/Skeleton'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TicketsPage() {
  const { data, isLoading, isError } = useTickets()

  return (
    <div className="min-h-screen bg-pitch-black text-porcelain">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-[590] tracking-[-0.2px]">Support Tickets</h1>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-[500] bg-aether-blue text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            New Ticket
          </Link>
        </div>

        {isError && (
          <div className="text-warning-red text-[13px]">Failed to load tickets. Try refreshing.</div>
        )}

        <div
          className="rounded-md overflow-hidden"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          {isLoading ? (
            <table className="w-full">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={5} />
                ))}
              </tbody>
            </table>
          ) : data && data.data.length === 0 ? (
              <div className="p-8 text-center text-storm-cloud text-[13px]">
                No tickets yet.{' '}
                <Link to="/tickets/new" className="text-aether-blue hover:underline">
                  Create your first ticket.
                </Link>
              </div>
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
                      Submitted By
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-[#23252a] last:border-0 hover:bg-[#161718] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="text-[13px] text-porcelain hover:text-aether-blue transition-colors"
                        >
                          {ticket.subject}
                        </Link>
                        {ticket.replies_count !== undefined && ticket.replies_count > 0 && (
                          <span className="ml-2 text-[11px] text-storm-cloud">
                            {ticket.replies_count}{' '}
                            {ticket.replies_count === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TicketStatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-4 py-3 text-[13px] text-storm-cloud">
                        {ticket.user?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-storm-cloud">
                        {formatDate(ticket.created_at)}
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
