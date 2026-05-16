import { describe, it, expect, beforeEach } from 'vitest'
import { useBoardStore } from './boardStore'
import type { Task } from '@/types'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    workspace_id: 1,
    board_column_id: 10,
    title: 'Task',
    description: null,
    priority: 'medium',
    position: 0,
    due_at: null,
    completed_at: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

describe('boardStore', () => {
  beforeEach(() => useBoardStore.getState().reset())

  it('sets column tasks', () => {
    const tasks = [makeTask({ id: 1 }), makeTask({ id: 2 })]
    useBoardStore.getState().setColumnTasks(10, tasks)
    expect(useBoardStore.getState().optimisticTasks[10]).toHaveLength(2)
  })

  it('moves a task between columns', () => {
    const task = makeTask({ id: 1, board_column_id: 10 })
    useBoardStore.getState().setColumnTasks(10, [task])
    useBoardStore.getState().setColumnTasks(20, [])
    useBoardStore.getState().moveTask(1, 10, 20, 0)

    expect(useBoardStore.getState().optimisticTasks[10]).toHaveLength(0)
    expect(useBoardStore.getState().optimisticTasks[20]).toHaveLength(1)
    expect(useBoardStore.getState().optimisticTasks[20][0].board_column_id).toBe(20)
  })
})
