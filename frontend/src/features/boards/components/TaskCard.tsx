import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/types'
import { cn } from '@/lib/utils'

const priorityColors: Record<Task['priority'], string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
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

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-400 transition-colors select-none',
        isDragging && 'opacity-50 shadow-lg',
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', priorityColors[task.priority])}>
          {task.priority}
        </span>
        {task.assignee && (
          <span className="text-xs text-gray-400 ml-auto">{task.assignee.name}</span>
        )}
      </div>
    </div>
  )
}
