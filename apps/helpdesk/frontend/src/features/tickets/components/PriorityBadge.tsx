import type { Ticket } from '@/types'

interface PriorityBadgeProps {
  priority: Ticket['priority']
}

const styles: Record<Ticket['priority'], string> = {
  low: 'bg-[#323334] text-[#8a8f98]',
  medium: 'bg-[#1e2a4a] text-[#5e6ad2]',
  high: 'bg-[#3a2010] text-[#f97316]',
  urgent: 'bg-[#3a1010] text-[#eb5757]',
}

const labels: Record<Ticket['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-[500] tracking-[0.02em] uppercase ${styles[priority]}`}
    >
      {labels[priority]}
    </span>
  )
}
