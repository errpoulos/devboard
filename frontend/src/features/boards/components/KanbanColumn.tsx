import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { BoardColumn, Task } from '@/types'
import TaskCard from './TaskCard'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  column: BoardColumn
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export default function KanbanColumn({ column, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center gap-2 mb-3">
        {column.color && (
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
        )}
        <h3 className="font-semibold text-sm text-gray-700">{column.name}</h3>
        <span className="ml-auto text-xs text-gray-400">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 min-h-[8rem] rounded-lg p-2 transition-colors',
          isOver ? 'bg-blue-50' : 'bg-gray-100',
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
