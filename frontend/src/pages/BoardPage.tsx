import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useBoard, useCreateColumn } from '@/features/workspace/hooks/useWorkspaces'
import { useReorderTasks, useUpdateTask } from '@/features/tasks/hooks/useTasks'
import { useBoardChannel } from '@/features/tasks/hooks/useBoardChannel'
import { useBoardStore } from '@/store/boardStore'
import { useImportTasks } from '@/features/csv/useCsvImport'
import KanbanColumn from '@/features/boards/components/KanbanColumn'
import TaskDetailModal from '@/features/boards/components/TaskDetailModal'
import ImportCsvModal from '@/features/csv/ImportCsvModal'
import type { ImportResult } from '@/features/csv/api'
import type { Task } from '@/types'

export default function BoardPage() {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>()
  const wsId = Number(workspaceId)
  const bId = Number(boardId)

  const { data: board, isLoading } = useBoard(wsId, bId)
  const reorderTasks = useReorderTasks(wsId, bId)
  const updateTask = useUpdateTask(wsId, bId)
  const createColumn = useCreateColumn(wsId, bId)
  const { optimisticTasks, setColumnTasks, moveTask, reset } = useBoardStore()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showColumnForm, setShowColumnForm] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const importTasks = useImportTasks(wsId, bId)

  useBoardChannel(wsId, bId)

  useEffect(() => {
    if (!board) return
    board.columns?.forEach((col) => {
      setColumnTasks(col.id, col.tasks ?? [])
    })
    return () => reset()
  }, [board, setColumnTasks, reset])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (isLoading) return <p className="text-[13px] text-storm-cloud">Loading board…</p>
  if (!board) return <p className="text-[13px] text-warning-red">Board not found.</p>

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const task = active.data.current?.task as Task | undefined
    if (!task) return

    const fromColumnId = task.board_column_id
    const overTask = over.data.current?.task as Task | undefined
    const toColumnId = overTask ? overTask.board_column_id : (over.id as number)

    const toTasks = optimisticTasks[toColumnId] ?? []
    const overIdx = toTasks.findIndex((t) => t.id === over.id)
    const newPosition = overIdx >= 0 ? overIdx : toTasks.length

    if (fromColumnId === toColumnId) {
      const fromTasks = optimisticTasks[fromColumnId] ?? []
      const oldIdx = fromTasks.findIndex((t) => t.id === active.id)
      const reordered = arrayMove(fromTasks, oldIdx, newPosition)
      setColumnTasks(fromColumnId, reordered)
      reorderTasks.mutate({ columnId: fromColumnId, orderedIds: reordered.map((t) => t.id) })
    } else {
      moveTask(task.id, fromColumnId, toColumnId, newPosition)
      updateTask.mutate({ taskId: task.id, data: { board_column_id: toColumnId } })
    }
  }

  function handleAddColumn() {
    const trimmed = newColumnName.trim()
    if (!trimmed) return
    createColumn.mutate(
      { name: trimmed },
      { onSuccess: () => { setNewColumnName(''); setShowColumnForm(false) } },
    )
  }

  const columns = board.columns ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-[590] text-porcelain tracking-[-0.22px]">
          {board.name}
        </h1>
        <button
          className="flex items-center gap-1.5 text-[12px] text-fog-grey hover:text-storm-cloud transition-colors tracking-[-0.1px]"
          onClick={() => { setShowImport(true); setImportResult(null) }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import CSV
        </button>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={optimisticTasks[col.id] ?? col.tasks ?? []}
              workspaceId={wsId}
              boardId={bId}
              onTaskClick={setSelectedTask}
            />
          ))}

          {/* Add column */}
          <div className="shrink-0 w-64">
            {showColumnForm ? (
              <div
                className="rounded-md border border-charcoal-grey p-3 flex flex-col gap-2"
                style={{ background: '#0f1011' }}
              >
                <input
                  className="w-full text-[13px] text-porcelain bg-transparent border border-charcoal-grey rounded px-2 py-1.5 placeholder:text-fog-grey focus:outline-none focus:border-muted-ash tracking-[-0.13px]"
                  placeholder="Column name…"
                  value={newColumnName}
                  autoFocus
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn()
                    if (e.key === 'Escape') { setShowColumnForm(false); setNewColumnName('') }
                  }}
                />
                <div className="flex gap-1.5">
                  <button
                    className="flex-1 text-[12px] font-[590] bg-neon-lime text-pitch-black rounded py-1 disabled:opacity-40"
                    onClick={handleAddColumn}
                    disabled={createColumn.isPending}
                  >
                    Add column
                  </button>
                  <button
                    className="text-[12px] text-fog-grey hover:text-storm-cloud px-2 transition-colors"
                    onClick={() => { setShowColumnForm(false); setNewColumnName('') }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="w-full text-[12px] text-fog-grey hover:text-storm-cloud border border-dashed border-charcoal-grey hover:border-muted-ash rounded-md py-3 transition-colors"
                onClick={() => setShowColumnForm(true)}
              >
                + Add column
              </button>
            )}
          </div>
        </div>
      </DndContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          columns={columns}
          workspaceId={wsId}
          boardId={bId}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {showImport && (
        <ImportCsvModal
          mode="tasks"
          workspaceId={wsId}
          boardId={bId}
          columnNames={columns.map((c) => c.name)}
          isPending={importTasks.isPending}
          result={importResult}
          onImport={(file) =>
            importTasks.mutate(file, {
              onSuccess: (res) => setImportResult(res),
            })
          }
          onClose={() => { setShowImport(false); setImportResult(null) }}
        />
      )}
    </div>
  )
}
