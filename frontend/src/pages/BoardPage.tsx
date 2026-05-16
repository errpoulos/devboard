import { useParams } from 'react-router'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useBoard } from '@/features/workspace/hooks/useWorkspaces'
import { useReorderTasks, useUpdateTask } from '@/features/tasks/hooks/useTasks'
import { useBoardChannel } from '@/features/tasks/hooks/useBoardChannel'
import { useBoardStore } from '@/store/boardStore'
import KanbanColumn from '@/features/boards/components/KanbanColumn'
import type { Task } from '@/types'
import { useEffect } from 'react'

export default function BoardPage() {
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>()
  const wsId = Number(workspaceId)
  const bId = Number(boardId)

  const { data: board, isLoading } = useBoard(wsId, bId)
  const reorderTasks = useReorderTasks(wsId, bId)
  const updateTask = useUpdateTask(wsId, bId)
  const { optimisticTasks, setColumnTasks, moveTask, reset } = useBoardStore()

  useBoardChannel(wsId, bId)

  useEffect(() => {
    if (!board) return
    board.columns?.forEach((col) => {
      setColumnTasks(col.id, col.tasks ?? [])
    })
    return () => reset()
  }, [board, setColumnTasks, reset])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (isLoading) return <p className="text-gray-500">Loading board…</p>
  if (!board) return <p className="text-red-500">Board not found.</p>

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const task = active.data.current?.task as Task | undefined
    if (!task) return

    const fromColumnId = task.board_column_id
    const toColumnId = typeof over.id === 'number' ? over.id : task.board_column_id

    const toTasks = optimisticTasks[toColumnId] ?? []
    const overIdx = toTasks.findIndex((t) => t.id === over.id)
    const newPosition = overIdx >= 0 ? overIdx : toTasks.length

    if (fromColumnId === toColumnId) {
      const fromTasks = optimisticTasks[fromColumnId] ?? []
      const oldIdx = fromTasks.findIndex((t) => t.id === active.id)
      const reordered = arrayMove(fromTasks, oldIdx, newPosition)
      setColumnTasks(fromColumnId, reordered)
      reorderTasks.mutate({
        columnId: fromColumnId,
        orderedIds: reordered.map((t) => t.id),
      })
    } else {
      moveTask(task.id, fromColumnId, toColumnId, newPosition)
      updateTask.mutate({ taskId: task.id, data: { board_column_id: toColumnId } })
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{board.name}</h1>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.columns?.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={optimisticTasks[col.id] ?? col.tasks ?? []}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
