import type { Ticket } from '@/types'

interface TicketStatusBadgeProps {
  status: Ticket['status']
}

const styles: Record<Ticket['status'], string> = {
  open: 'bg-[#323334] text-[#8a8f98]',
  in_progress: 'bg-[#1e2a4a] text-[#5e6ad2]',
  resolved: 'bg-[#0d2a1a] text-[#27a644]',
  closed: 'bg-[#1a1a1e] text-[#62666d]',
}

const labels: Record<Ticket['status'], string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export default function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-[500] tracking-[0.02em] uppercase ${styles[status]}`}
    >
      {labels[status]}
    </span>
  )
}
