import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import type { BoardColumn, Task } from '@/types'
import { useCreateTask } from '@/features/tasks/hooks/useTasks'
import { cn } from '@/lib/utils'
import TaskCard from './TaskCard'

interface KanbanColumnProps {
  column: BoardColumn
  tasks: Task[]
  workspaceId: number
  boardId: number
  onTaskClick?: (task: Task) => void
}

export default function KanbanColumn({
  column,
  tasks,
  workspaceId,
  boardId,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const createTask = useCreateTask(workspaceId, boardId)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')

  function handleAdd() {
    const trimmed = title.trim()
    if (!trimmed) return
    createTask.mutate(
      { title: trimmed, board_column_id: column.id, priority: 'medium' },
      { onSuccess: () => { setTitle(''); setShowForm(false) } },
    )
  }

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        {column.color && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
        )}
        <span className="text-[12px] font-[510] text-storm-cloud tracking-[-0.1px] uppercase">
          {column.name}
        </span>
        <span className="ml-auto text-[11px] text-fog-grey">{tasks.length}</span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-1.5 min-h-32 rounded-md p-2 transition-colors',
          isOver ? 'bg-charcoal-grey' : 'bg-deep-slate',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </SortableContext>

        {showForm ? (
          <div
            className="rounded-md border border-charcoal-grey p-2 flex flex-col gap-2 mt-1"
            style={{ background: '#0f1011' }}
          >
            <textarea
              className="w-full text-[13px] text-porcelain bg-transparent resize-none border border-charcoal-grey rounded px-2 py-1.5 placeholder:text-fog-grey focus:outline-none focus:border-muted-ash tracking-[-0.13px]"
              rows={2}
              placeholder="Task title…"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() }
                if (e.key === 'Escape') { setShowForm(false); setTitle('') }
              }}
            />
            <div className="flex gap-1.5">
              <button
                className="flex-1 text-[12px] font-[590] bg-neon-lime text-pitch-black rounded py-1 disabled:opacity-40 tracking-[-0.1px]"
                onClick={handleAdd}
                disabled={createTask.isPending}
              >
                Add task
              </button>
              <button
                className="text-[12px] text-fog-grey hover:text-storm-cloud px-2 transition-colors"
                onClick={() => { setShowForm(false); setTitle('') }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-0.5 text-[12px] text-fog-grey hover:text-storm-cloud text-left px-1 py-1 transition-colors"
            onClick={() => setShowForm(true)}
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  )
}
