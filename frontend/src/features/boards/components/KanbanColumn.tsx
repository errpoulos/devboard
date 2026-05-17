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
      {
        onSuccess: () => {
          setTitle('')
          setShowForm(false)
        },
      },
    )
  }

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
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </SortableContext>

        {showForm ? (
          <div className="bg-white border border-gray-200 rounded-lg p-2 flex flex-col gap-2">
            <textarea
              className="w-full text-sm resize-none border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Task title…"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAdd()
                }
                if (e.key === 'Escape') {
                  setShowForm(false)
                  setTitle('')
                }
              }}
            />
            <div className="flex gap-1.5">
              <button
                className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded py-1 font-medium disabled:opacity-50"
                onClick={handleAdd}
                disabled={createTask.isPending}
              >
                Add task
              </button>
              <button
                className="text-xs text-gray-500 hover:text-gray-700 px-2"
                onClick={() => {
                  setShowForm(false)
                  setTitle('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-1 text-xs text-gray-400 hover:text-gray-600 text-left px-1 py-0.5"
            onClick={() => setShowForm(true)}
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  )
}
