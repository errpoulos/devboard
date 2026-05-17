import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'

const priorityConfig: Record<Task['priority'], { label: string; className: string }> = {
  low:    { label: 'Low',    className: 'bg-gunmetal text-storm-cloud' },
  medium: { label: 'Medium', className: 'bg-aether-blue/20 text-aether-blue' },
  high:   { label: 'High',   className: 'bg-[#2d1f00] text-[#d97706]' },
  urgent: { label: 'Urgent', className: 'bg-warning-red/15 text-warning-red' },
}

function formatDueDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  })

  const isOverdue = task.due_at && !task.completed_at && new Date(task.due_at) < new Date()
  const priority = priorityConfig[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        boxShadow: isDragging
          ? 'rgba(8, 9, 10, 0.6) 0px 4px 32px 0px'
          : 'rgba(0, 0, 0, 0.4) 0px 2px 4px 0px',
        background: '#0f1011',
      }}
      className={cn(
        'rounded-md border border-charcoal-grey p-2.5 cursor-pointer select-none transition-colors hover:border-muted-ash',
        isDragging && 'opacity-50',
        task.completed_at && 'opacity-50',
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <p
        className={cn(
          'text-[13px] text-porcelain leading-snug tracking-[-0.13px]',
          task.completed_at && 'line-through text-fog-grey',
        )}
      >
        {task.title}
      </p>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <span
          className={cn(
            'text-[11px] px-1.5 py-0.5 rounded font-[510] tracking-[-0.1px]',
            priority.className,
          )}
          style={{ borderRadius: '4px' }}
        >
          {priority.label}
        </span>

        {task.story_points != null && (
          <span
            className="text-[11px] px-1.5 py-0.5 font-[510] tracking-[-0.1px] bg-amethyst/15 text-amethyst"
            style={{ borderRadius: '4px' }}
          >
            {task.story_points} SP
          </span>
        )}

        {task.due_at && (
          <span
            className={cn(
              'text-[11px] ml-auto tracking-[-0.1px]',
              isOverdue ? 'text-warning-red' : 'text-fog-grey',
            )}
          >
            {isOverdue ? '⚠ ' : ''}{formatDueDate(task.due_at)}
          </span>
        )}

        {!task.due_at && task.assignee && (
          <span className="text-[11px] text-fog-grey ml-auto tracking-[-0.1px]">
            {task.assignee.name}
          </span>
        )}
      </div>
    </div>
  )
}
