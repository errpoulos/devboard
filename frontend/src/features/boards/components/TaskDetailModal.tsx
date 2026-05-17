import { useEffect, useRef, useState } from 'react'
import type { Task } from '@/types'
import { useUpdateTask, useDeleteTask } from '@/features/tasks/hooks/useTasks'
import { cn } from '@/lib/utils'

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

const priorityColors: Record<Task['priority'], string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

interface Props {
  task: Task
  workspaceId: number
  boardId: number
  onClose: () => void
}

export default function TaskDetailModal({ task, workspaceId, boardId, onClose }: Props) {
  const updateTask = useUpdateTask(workspaceId, boardId)
  const deleteTask = useDeleteTask(workspaceId, boardId)

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState<Task['priority']>(task.priority)
  const [storyPoints, setStoryPoints] = useState<string>(
    task.story_points != null ? String(task.story_points) : '',
  )
  const [dueAt, setDueAt] = useState(toDateInputValue(task.due_at))
  const [completed, setCompleted] = useState(!!task.completed_at)

  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
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
          story_points: storyPoints !== '' ? Number(storyPoints) : null,
          due_at: dueAt || null,
          completed_at: completed
            ? (task.completed_at ?? new Date().toISOString())
            : null,
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

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
          <input
            className="flex-1 text-lg font-semibold text-gray-900 bg-transparent border-0 border-b-2 border-transparent focus:border-blue-500 focus:outline-none pb-0.5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5 shrink-0"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 flex-1">
          {/* Completion toggle */}
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 rounded accent-green-600"
            />
            <span className="text-sm text-gray-600">Mark as complete</span>
          </label>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Add a description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <select
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <span className={cn('mt-1 inline-block text-xs px-1.5 py-0.5 rounded font-medium', priorityColors[priority])}>
                {priority}
              </span>
            </div>

            {/* Story points */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Story Points</label>
              <input
                type="number"
                min={0}
                max={999}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="—"
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
              />
            </div>

            {/* Due date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
              <input
                type="date"
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
          </div>

          {/* Assignee (read-only for now) */}
          {task.assignee && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
              <p className="text-sm text-gray-700">{task.assignee.name}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 p-5 border-t border-gray-100">
          <button
            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
            onClick={handleDelete}
            disabled={isPending}
          >
            Delete task
          </button>
          <div className="flex gap-2">
            <button
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1.5 font-medium disabled:opacity-50"
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
