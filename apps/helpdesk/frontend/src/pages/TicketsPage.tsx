import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, SlidersHorizontal, X } from 'lucide-react'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { useAgents } from '@/features/tickets/hooks/useTickets'
import PriorityBadge from '@/features/tickets/components/PriorityBadge'
import TicketStatusBadge from '@/features/tickets/components/TicketStatusBadge'
import { TableRowSkeleton } from '@/components/Skeleton'
import { useAuthStore } from '@/store/authStore'
import type { TicketFilters } from '@/features/tickets/api'

const TYPE_LABELS: Record<string, string> = {
  support_request: 'Support',
  bug_report: 'Bug',
  feature_request: 'Feature',
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const TYPE_OPTIONS = [
  { value: 'support_request', label: 'Support Request' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function MultiCheckbox({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (val: string[]) => void
}) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={[
            'text-[12px] px-2 py-1 rounded border transition-colors',
            value.includes(opt.value)
              ? 'bg-aether-blue border-aether-blue text-white'
              : 'bg-[#23252a] border-[#383b3f] text-storm-cloud hover:border-[#555] hover:text-porcelain',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

interface ActiveFilters {
  statuses: string[]
  types: string[]
  priorities: string[]
  assigned_to: string
  date_from: string
  date_to: string
  search: string
}

const EMPTY_FILTERS: ActiveFilters = {
  statuses: [],
  types: [],
  priorities: [],
  assigned_to: '',
  date_from: '',
  date_to: '',
  search: '',
}

function buildApiFilters(f: ActiveFilters): TicketFilters {
  const filters: TicketFilters = {}
  if (f.statuses.length > 0) filters.status = f.statuses.join(',')
  if (f.types.length > 0) filters.type = f.types.join(',')
  if (f.priorities.length > 0) filters.priority = f.priorities.join(',')
  if (f.assigned_to) filters.assigned_to = f.assigned_to
  if (f.date_from) filters.date_from = f.date_from
  if (f.date_to) filters.date_to = f.date_to
  if (f.search) filters.search = f.search
  return filters
}

function hasActiveFilters(f: ActiveFilters): boolean {
  return (
    f.statuses.length > 0 ||
    f.types.length > 0 ||
    f.priorities.length > 0 ||
    !!f.assigned_to ||
    !!f.date_from ||
    !!f.date_to ||
    !!f.search
  )
}

export default function TicketsPage() {
  const user = useAuthStore((s) => s.user)
  const isAgent = user?.role === 'agent' || user?.role === 'administrator'
  const isCustomer = !isAgent
  const customerOrgs = user?.organizations ?? []
  const hasMultipleOrgs = isCustomer && customerOrgs.length > 1

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS)
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>(undefined)

  const apiFilters: TicketFilters = isAgent
    ? buildApiFilters(filters)
    : hasMultipleOrgs && selectedOrgId
      ? { organization_id: selectedOrgId }
      : {}
  const { data, isLoading, isError } = useTickets(apiFilters)
  const { data: agentsData } = useAgents()
  const agents = agentsData?.data ?? []

  function clearFilter(key: keyof ActiveFilters) {
    setFilters((prev) => ({
      ...prev,
      [key]: Array.isArray(prev[key]) ? [] : '',
    }))
  }

  // Build chip labels
  const chips: { label: string; key: keyof ActiveFilters }[] = []
  filters.statuses.forEach((s) =>
    chips.push({ label: `Status: ${STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s}`, key: 'statuses' }),
  )
  filters.types.forEach((t) =>
    chips.push({ label: `Type: ${TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t}`, key: 'types' }),
  )
  filters.priorities.forEach((p) =>
    chips.push({ label: `Priority: ${PRIORITY_OPTIONS.find((o) => o.value === p)?.label ?? p}`, key: 'priorities' }),
  )
  if (filters.assigned_to) {
    const agentName =
      filters.assigned_to === 'unassigned'
        ? 'Unassigned'
        : agents.find((a) => String(a.id) === filters.assigned_to)?.name ?? filters.assigned_to
    chips.push({ label: `Assigned to: ${agentName}`, key: 'assigned_to' })
  }
  if (filters.date_from) chips.push({ label: `From: ${filters.date_from}`, key: 'date_from' })
  if (filters.date_to) chips.push({ label: `To: ${filters.date_to}`, key: 'date_to' })
  if (filters.search) chips.push({ label: `Search: ${filters.search}`, key: 'search' })

  return (
    <div className="min-h-screen bg-pitch-black text-porcelain">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-[590] tracking-[-0.2px]">Support Tickets</h1>
          <div className="flex items-center gap-2">
            {isAgent && (
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className={[
                  'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-[500] transition-colors border',
                  filtersOpen
                    ? 'bg-[#1a1b1e] text-porcelain border-[#383b3f]'
                    : 'bg-transparent text-storm-cloud border-[#2a2c2f] hover:text-porcelain hover:border-[#383b3f]',
                ].join(' ')}
              >
                <SlidersHorizontal size={13} strokeWidth={1.8} />
                Filters
                {hasActiveFilters(filters) && (
                  <span
                    className="ml-0.5 w-4 h-4 rounded-full text-[10px] font-[600] flex items-center justify-center"
                    style={{ background: '#5e6ad2', color: '#fff' }}
                  >
                    {chips.length}
                  </span>
                )}
              </button>
            )}
            <Link
              to="/tickets/new"
              className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-[500] bg-aether-blue text-white hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              New Ticket
            </Link>
          </div>
        </div>

        {/* Filter panel */}
        {isAgent && filtersOpen && (
          <div
            className="rounded-md p-5 mb-4 space-y-4"
            style={{ background: '#0f1011', boxShadow: 'rgba(0,0,0,0.4) 0px 2px 4px 0px' }}
          >
            {/* Search */}
            <div>
              <label className="block text-[11px] text-storm-cloud uppercase tracking-[0.05em] mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search by subject…"
                className="w-full max-w-xs rounded px-3 py-1.5 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue placeholder:text-fog-grey"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] text-storm-cloud uppercase tracking-[0.05em] mb-2">
                Status
              </label>
              <MultiCheckbox
                options={STATUS_OPTIONS}
                value={filters.statuses}
                onChange={(v) => setFilters((f) => ({ ...f, statuses: v }))}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[11px] text-storm-cloud uppercase tracking-[0.05em] mb-2">
                Type
              </label>
              <MultiCheckbox
                options={TYPE_OPTIONS}
                value={filters.types}
                onChange={(v) => setFilters((f) => ({ ...f, types: v }))}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] text-storm-cloud uppercase tracking-[0.05em] mb-2">
                Priority
              </label>
              <MultiCheckbox
                options={PRIORITY_OPTIONS}
                value={filters.priorities}
                onChange={(v) => setFilters((f) => ({ ...f, priorities: v }))}
              />
            </div>

            {/* Assigned to */}
            <div>
              <label className="block text-[11px] text-storm-cloud uppercase tracking-[0.05em] mb-2">
                Assigned to
              </label>
              <select
                value={filters.assigned_to}
                onChange={(e) => setFilters((f) => ({ ...f, assigned_to: e.target.value }))}
                className="rounded px-3 py-1.5 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue"
              >
                <option value="">Any</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-[11px] text-storm-cloud uppercase tracking-[0.05em] mb-2">
                  Date from
                </label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                  className="rounded px-3 py-1.5 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue"
                />
              </div>
              <div>
                <label className="block text-[11px] text-storm-cloud uppercase tracking-[0.05em] mb-2">
                  Date to
                </label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                  className="rounded px-3 py-1.5 text-[13px] bg-[#23252a] text-porcelain border border-[#383b3f] focus:outline-none focus:border-aether-blue"
                />
              </div>
              {hasActiveFilters(filters) && (
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="text-[12px] text-storm-cloud hover:text-warning-red transition-colors pb-1.5"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {isAgent && chips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {chips.map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-[12px] px-2 py-0.5 rounded-full"
                style={{ background: '#1a1b1e', color: '#d0d6e0', border: '1px solid #2a2c2f' }}
              >
                {chip.label}
                <button
                  onClick={() => clearFilter(chip.key)}
                  className="text-storm-cloud hover:text-porcelain transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Org tabs for customers with multiple orgs */}
        {hasMultipleOrgs && (
          <div className="flex items-center gap-1 mb-4">
            <button
              onClick={() => setSelectedOrgId(undefined)}
              className={[
                'px-3 py-1.5 rounded text-[12px] font-[500] transition-colors',
                selectedOrgId === undefined
                  ? 'bg-[#1a1b1e] text-porcelain'
                  : 'text-storm-cloud hover:text-porcelain',
              ].join(' ')}
            >
              All
            </button>
            {customerOrgs.map((org) => (
              <button
                key={org.id}
                onClick={() => setSelectedOrgId(org.id)}
                className={[
                  'px-3 py-1.5 rounded text-[12px] font-[500] transition-colors',
                  selectedOrgId === org.id
                    ? 'bg-[#1a1b1e] text-porcelain'
                    : 'text-storm-cloud hover:text-porcelain',
                ].join(' ')}
              >
                {org.name}
              </button>
            ))}
          </div>
        )}

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
                  <TableRowSkeleton key={i} cols={isAgent ? 6 : 5} />
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
                  {isAgent && (
                    <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                      Type
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                    Priority
                  </th>
                  {isAgent && (
                    <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                      Submitted By
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((ticket) => (
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
                    {isAgent && (
                      <td className="px-4 py-3">
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded font-[500]"
                          style={{
                            background:
                              ticket.type === 'bug_report'
                                ? '#3d151566'
                                : ticket.type === 'feature_request'
                                  ? '#1a253566'
                                  : '#23252a',
                            color:
                              ticket.type === 'bug_report'
                                ? '#fc8181'
                                : ticket.type === 'feature_request'
                                  ? '#63b3ed'
                                  : '#6b7280',
                          }}
                        >
                          {TYPE_LABELS[ticket.type ?? 'support_request'] ?? 'Support'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    {isAgent && (
                      <td className="px-4 py-3 text-[13px] text-storm-cloud">
                        {ticket.user?.name ?? '—'}
                      </td>
                    )}
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
