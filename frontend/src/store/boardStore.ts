import { create } from 'zustand'
import type { Task } from '@/types'

interface BoardState {
  optimisticTasks: Record<number, Task[]> // columnId -> tasks
  setColumnTasks: (columnId: number, tasks: Task[]) => void
  moveTask: (taskId: number, fromColumnId: number, toColumnId: number, newPosition: number) => void
  reset: () => void
}

export const useBoardStore = create<BoardState>((set) => ({
  optimisticTasks: {},
  setColumnTasks: (columnId, tasks) =>
    set((s) => ({ optimisticTasks: { ...s.optimisticTasks, [columnId]: tasks } })),
  moveTask: (taskId, fromColumnId, toColumnId, newPosition) =>
    set((s) => {
      const next = { ...s.optimisticTasks }
      const fromTasks = [...(next[fromColumnId] ?? [])]
      const idx = fromTasks.findIndex((t) => t.id === taskId)
      if (idx === -1) return s
      const [task] = fromTasks.splice(idx, 1)
      const toTasks = [...(next[toColumnId] ?? [])]
      toTasks.splice(newPosition, 0, { ...task, board_column_id: toColumnId })
      next[fromColumnId] = fromTasks
      next[toColumnId] = toTasks
      return { optimisticTasks: next }
    }),
  reset: () => set({ optimisticTasks: {} }),
}))
