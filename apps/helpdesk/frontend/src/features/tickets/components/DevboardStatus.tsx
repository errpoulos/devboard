import { Wrench } from 'lucide-react'
import type { DevboardTask } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const COLUMN_COLORS: Record<string, string> = {
  Backlog: '#4a5568',
  'In Progress': '#2b6cb0',
  Fixed: '#276749',
  Closed: '#4a5568',
  'Under Review': '#b7791f',
  Released: '#276749',
}

interface Props {
  devboardTask: DevboardTask
}

export default function DevboardStatus({ devboardTask }: Props) {
  const columnColor = COLUMN_COLORS[devboardTask.column] ?? '#4a5568'

  return (
    <div
      className="rounded-md p-4 space-y-3"
      style={{ background: '#111518', border: '1px solid #1e2530' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-[500] text-storm-cloud uppercase tracking-[0.05em]">
          DevBoard Task #{devboardTask.task_id}
        </span>
        <span
          className="text-[11px] font-[500] px-2 py-0.5 rounded"
          style={{ background: columnColor + '33', color: columnColor === '#4a5568' ? '#a0aec0' : '#fff', border: `1px solid ${columnColor}66` }}
        >
          {devboardTask.column}
        </span>
      </div>

      {devboardTask.comments.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-storm-cloud uppercase tracking-[0.05em]">
            Developer Notes
          </p>
          {devboardTask.comments.map((c) => (
            <div
              key={c.id}
              className="rounded px-3 py-2"
              style={{ background: '#1a1f26', border: '1px solid #1e2530' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Wrench size={10} className="text-storm-cloud" />
                <span className="text-[11px] font-[500] text-[#7ab3d4]">{c.author}</span>
                <span className="text-[11px] text-fog-grey ml-auto">{formatDate(c.created_at)}</span>
              </div>
              <p className="text-[12px] text-[#c4c7cc] whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
