import NotesPanel from './NotesPanel'
import DevboardStatus from './DevboardStatus'
import type { ClientNote, DevboardTask, Ticket, User } from '@/types'

interface Props {
  ticket: Ticket
  customer?: User
  agents: User[]
  onAssigneeChange: (agentId: number | null) => void
  onTypeChange: (type: Ticket['type']) => void
}

export default function AgentSidebar({ ticket, agents, onAssigneeChange, onTypeChange }: Props) {
  const customer = ticket.user
  const supportNotes: ClientNote[] = ticket.customer_notes?.filter((n) => n.category === 'support') ?? []
  const salesNotes: ClientNote[] = ticket.customer_notes?.filter((n) => n.category === 'sales') ?? []
  const orgNotes: ClientNote[] = ticket.org_notes ?? []

  return (
    <aside className="space-y-6">
      {/* Ticket controls — type + assignee */}
      <div
        className="rounded-md p-4 space-y-3"
        style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
      >
        <p className="text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
          Ticket Settings
        </p>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] text-storm-cloud mb-1">Type</label>
            <select
              value={ticket.type ?? 'support_request'}
              onChange={(e) => onTypeChange(e.target.value as Ticket['type'])}
              className="w-full rounded px-2 py-1.5 text-[12px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue"
            >
              <option value="support_request">Support Request</option>
              <option value="bug_report">Bug Report</option>
              <option value="feature_request">Feature Request</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-storm-cloud mb-1">Assignee</label>
            <select
              value={ticket.assigned_to?.id ?? ''}
              onChange={(e) =>
                onAssigneeChange(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded px-2 py-1.5 text-[12px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue"
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customer info */}
      {customer && (
        <div
          className="rounded-md p-4 space-y-1.5"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          <p className="text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em] mb-2">
            Customer
          </p>
          <p className="text-[13px] font-[500] text-porcelain">{customer.name}</p>
          <p className="text-[12px] text-storm-cloud">{customer.email}</p>
        </div>
      )}

      {/* Customer notes */}
      {customer && (
        <div
          className="rounded-md p-4"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          <p className="text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em] mb-3">
            Client Notes
          </p>
          <NotesPanel
            userId={customer.id}
            supportNotes={supportNotes}
            salesNotes={salesNotes}
          />
        </div>
      )}

      {/* Org notes */}
      {orgNotes.length > 0 && (
        <div
          className="rounded-md p-4"
          style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
        >
          <p className="text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em] mb-3">
            Org Notes
          </p>
          <ul className="space-y-2">
            {orgNotes.map((note) => (
              <li key={note.id} className="rounded px-3 py-2" style={{ background: '#161718', border: '1px solid #23252a' }}>
                <p className="text-[12px] text-[#c4c7cc] whitespace-pre-wrap">{note.body}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-storm-cloud">{note.author?.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DevBoard task status */}
      {ticket.devboard_task && (
        <DevboardStatus devboardTask={ticket.devboard_task as DevboardTask} />
      )}
    </aside>
  )
}
