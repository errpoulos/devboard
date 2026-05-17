import { useEffect, useRef, useState } from 'react'
import type { BoardColumn, Task } from '@/types'
import { useUpdateTask, useDeleteTask } from '@/features/tasks/hooks/useTasks'
import { cn } from '@/lib/utils'

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

const priorityConfig: Record<Task['priority'], { label: string; className: string }> = {
  low:    { label: 'Low',    className: 'bg-gunmetal text-storm-cloud' },
  medium: { label: 'Medium', className: 'bg-aether-blue/20 text-aether-blue' },
  high:   { label: 'High',   className: 'bg-[#2d1f00] text-[#d97706]' },
  urgent: { label: 'Urgent', className: 'bg-warning-red/15 text-warning-red' },
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

interface Props {
  task: Task
  columns: BoardColumn[]
  workspaceId: number
  boardId: number
  onClose: () => void
}

export default function TaskDetailModal({ task, columns, workspaceId, boardId, onClose }: Props) {
  const updateTask = useUpdateTask(workspaceId, boardId)
  const deleteTask = useDeleteTask(workspaceId, boardId)

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState<Task['priority']>(task.priority)
  const [columnId, setColumnId] = useState(task.board_column_id)
  const [storyPoints, setStoryPoints] = useState<string>(
    task.story_points != null ? String(task.story_points) : '',
  )
  const [dueAt, setDueAt] = useState(toDateInputValue(task.due_at))

  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave() {
    updateTask.mutate(
      {
        taskId: task.id,
        data: {
          title: title.trim() || task.title,
          description: description || null,
          priority,
          board_column_id: columnId,
          story_points: storyPoints !== '' ? Number(storyPoints) : null,
          due_at: dueAt || null,
        },
      },
      { onSuccess: onClose },
    )
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    deleteTask.mutate(task.id, { onSuccess: onClose })
  }

  const isPending = updateTask.isPending || deleteTask.isPending
  const activePriority = priorityConfig[priority]
  const activeColumn = columns.find((c) => c.id === columnId)

  const inputClass =
    'w-full text-[13px] text-porcelain bg-transparent border border-charcoal-grey rounded-md px-3 py-2 placeholder:text-fog-grey focus:outline-none focus:border-muted-ash tracking-[-0.13px]'

  const selectStyle = { background: '#161718' }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-pitch-black/70 p-4"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col rounded-md"
        style={{
          background: '#161718',
          boxShadow: 'rgba(8, 9, 10, 0.6) 0px 4px 32px 0px, rgb(35, 37, 42) 0px 0px 0px 1px inset',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-charcoal-grey">
          <input
            className="flex-1 text-[16px] font-[510] text-porcelain bg-transparent border-0 focus:outline-none tracking-[-0.13px] placeholder:text-fog-grey"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
          />
          <button
            className="text-fog-grey hover:text-storm-cloud text-lg leading-none mt-0.5 shrink-0 transition-colors"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 flex-1">
          {/* Description */}
          <div>
            <label className="block text-[11px] text-fog-grey tracking-[-0.1px] uppercase mb-1.5">
              Description
            </label>
            <textarea
              className={cn(inputClass, 'resize-none')}
              rows={3}
              placeholder="Add a description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Fields grid — Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status */}
            <div>
              <label className="block text-[11px] text-fog-grey tracking-[-0.1px] uppercase mb-1.5">
                Status
              </label>
              <select
                className={cn(inputClass, 'cursor-pointer')}
                value={columnId}
                style={selectStyle}
                onChange={(e) => setColumnId(Number(e.target.value))}
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id} style={selectStyle}>
                    {col.name}
                  </option>
                ))}
              </select>
              {activeColumn && (
                <span className="mt-1.5 flex items-center gap-1.5">
                  {activeColumn.color && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: activeColumn.color }}
                    />
                  )}
                  <span className="text-[11px] text-storm-cloud tracking-[-0.1px]">
                    {activeColumn.name}
                  </span>
                </span>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] text-fog-grey tracking-[-0.1px] uppercase mb-1.5">
                Priority
              </label>
              <select
                className={cn(inputClass, 'cursor-pointer')}
                value={priority}
                style={selectStyle}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} style={selectStyle}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <span
                className={cn(
                  'mt-1.5 inline-block text-[11px] px-1.5 py-0.5 font-[510] tracking-[-0.1px]',
                  activePriority.className,
                )}
                style={{ borderRadius: '4px' }}
              >
                {activePriority.label}
              </span>
            </div>
          </div>

          {/* Story points + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-fog-grey tracking-[-0.1px] uppercase mb-1.5">
                Story Points
              </label>
              <input
                type="number"
                min={0}
                max={999}
                className={inputClass}
                placeholder="—"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] text-fog-grey tracking-[-0.1px] uppercase mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                className={inputClass}
                style={{ colorScheme: 'dark' }}
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>

          {task.assignee && (
            <div>
              <label className="block text-[11px] text-fog-grey tracking-[-0.1px] uppercase mb-1.5">
                Assignee
              </label>
              <p className="text-[13px] text-light-steel tracking-[-0.13px]">{task.assignee.name}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-charcoal-grey">
          <button
            className="text-[13px] text-fog-grey hover:text-warning-red transition-colors disabled:opacity-40 tracking-[-0.13px]"
            onClick={handleDelete}
            disabled={isPending}
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              className="text-[13px] text-storm-cloud hover:text-porcelain px-3 py-1.5 transition-colors tracking-[-0.13px]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="text-[13px] font-[590] bg-neon-lime text-pitch-black rounded-md px-4 py-1.5 disabled:opacity-40 tracking-[-0.13px] hover:bg-[#cdd91f] transition-colors"
              onClick={handleSave}
              disabled={isPending}
            >
              {updateTask.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
