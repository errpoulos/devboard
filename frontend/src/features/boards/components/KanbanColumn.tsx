import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import type { BoardColumn, Task } from '@/types'
import { useCreateTask } from '@/features/tasks/hooks/useTasks'
import { useUpdateColumn, useDeleteColumn } from '@/features/workspace/hooks/useWorkspaces'
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
  const updateColumn = useUpdateColumn(workspaceId, boardId)
  const deleteColumn = useDeleteColumn(workspaceId, boardId)

  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(column.name)

  function handleAddTask() {
    const trimmed = taskTitle.trim()
    if (!trimmed) return
    createTask.mutate(
      { title: trimmed, board_column_id: column.id, priority: 'medium' },
      { onSuccess: () => { setTaskTitle(''); setShowTaskForm(false) } },
    )
  }

  function handleRename() {
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === column.name) { setEditingName(false); return }
    updateColumn.mutate(
      { columnId: column.id, data: { name: trimmed } },
      { onSuccess: () => setEditingName(false) },
    )
  }

  function handleDelete() {
    const taskCount = tasks.length
    const msg = taskCount > 0
      ? `Delete column "${column.name}"? This will also delete ${taskCount} task${taskCount === 1 ? '' : 's'}. This cannot be undone.`
      : `Delete column "${column.name}"?`
    if (!window.confirm(msg)) return
    deleteColumn.mutate(column.id)
  }

  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 px-1 group/header">
        {editingName ? (
          <input
            className="flex-1 text-[12px] font-[510] text-porcelain bg-transparent border-b border-muted-ash focus:outline-none tracking-[-0.1px] uppercase"
            value={nameValue}
            autoFocus
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') { setEditingName(false); setNameValue(column.name) }
            }}
          />
        ) : (
          <>
            {column.color && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
            )}
            <span className="text-[12px] font-[510] text-storm-cloud tracking-[-0.1px] uppercase flex-1 truncate">
              {column.name}
            </span>
            <span className="text-[11px] text-fog-grey mr-1">{tasks.length}</span>
            <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
              <button
                className="p-0.5 text-fog-grey hover:text-storm-cloud rounded transition-colors"
                title="Rename column"
                onClick={() => { setNameValue(column.name); setEditingName(true) }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
                </svg>
              </button>
              <button
                className="p-0.5 text-fog-grey hover:text-warning-red rounded transition-colors"
                title="Delete column"
                onClick={handleDelete}
                disabled={deleteColumn.isPending}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </>
        )}
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

        {showTaskForm ? (
          <div
            className="rounded-md border border-charcoal-grey p-2 flex flex-col gap-2 mt-1"
            style={{ background: '#0f1011' }}
          >
            <textarea
              className="w-full text-[13px] text-porcelain bg-transparent resize-none border border-charcoal-grey rounded px-2 py-1.5 placeholder:text-fog-grey focus:outline-none focus:border-muted-ash tracking-[-0.13px]"
              rows={2}
              placeholder="Task title…"
              value={taskTitle}
              autoFocus
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTask() }
                if (e.key === 'Escape') { setShowTaskForm(false); setTaskTitle('') }
              }}
            />
            <div className="flex gap-1.5">
              <button
                className="flex-1 text-[12px] font-[590] bg-neon-lime text-pitch-black rounded py-1 disabled:opacity-40 tracking-[-0.1px]"
                onClick={handleAddTask}
                disabled={createTask.isPending}
              >
                Add task
              </button>
              <button
                className="text-[12px] text-fog-grey hover:text-storm-cloud px-2 transition-colors"
                onClick={() => { setShowTaskForm(false); setTaskTitle('') }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-0.5 text-[12px] text-fog-grey hover:text-storm-cloud text-left px-1 py-1 transition-colors"
            onClick={() => setShowTaskForm(true)}
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  )
}
