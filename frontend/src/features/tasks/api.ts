import api from '@/api/axios'
import type { ApiResource, Comment, Task } from '@/types'

type CreateTaskPayload = {
  title: string
  board_column_id: number
  description?: string
  assignee_id?: number
  priority?: string
  due_at?: string
}

type UpdateTaskPayload = Partial<CreateTaskPayload & { completed_at: string | null }>

export async function createTask(
  workspaceId: number,
  boardId: number,
  data: CreateTaskPayload,
): Promise<Task> {
  const res = await api.post<ApiResource<Task>>(
    `/workspaces/${workspaceId}/boards/${boardId}/tasks`,
    data,
  )
  return res.data.data
}

export async function updateTask(
  workspaceId: number,
  boardId: number,
  taskId: number,
  data: UpdateTaskPayload,
): Promise<Task> {
  const res = await api.patch<ApiResource<Task>>(
    `/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}`,
    data,
  )
  return res.data.data
}

export async function deleteTask(
  workspaceId: number,
  boardId: number,
  taskId: number,
): Promise<void> {
  await api.delete(`/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}`)
}

export async function reorderTasks(
  workspaceId: number,
  boardId: number,
  columnId: number,
  orderedIds: number[],
): Promise<void> {
  await api.post(`/workspaces/${workspaceId}/boards/${boardId}/tasks/reorder`, {
    column_id: columnId,
    ordered_ids: orderedIds,
  })
}

export async function getComments(
  workspaceId: number,
  boardId: number,
  taskId: number,
): Promise<Comment[]> {
  const res = await api.get<{ data: Comment[] }>(
    `/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/comments`,
  )
  return res.data.data
}

export async function createComment(
  workspaceId: number,
  boardId: number,
  taskId: number,
  body: string,
): Promise<Comment> {
  const res = await api.post<ApiResource<Comment>>(
    `/workspaces/${workspaceId}/boards/${boardId}/tasks/${taskId}/comments`,
    { body },
  )
  return res.data.data
}
