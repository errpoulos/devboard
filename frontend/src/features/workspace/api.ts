import api from '@/api/axios'
import type { ApiResource, Board, BoardColumn, Workspace } from '@/types'

export async function getWorkspaces(): Promise<Workspace[]> {
  const res = await api.get<{ data: Workspace[] }>('/workspaces')
  return res.data.data
}

export async function createWorkspace(name: string, slug: string): Promise<Workspace> {
  const res = await api.post<ApiResource<Workspace>>('/workspaces', { name, slug })
  return res.data.data
}

export async function getBoards(workspaceId: number): Promise<Board[]> {
  const res = await api.get<{ data: Board[] }>(`/workspaces/${workspaceId}/boards`)
  return res.data.data
}

export async function getBoard(workspaceId: number, boardId: number): Promise<Board> {
  const res = await api.get<ApiResource<Board>>(`/workspaces/${workspaceId}/boards/${boardId}`)
  return res.data.data
}

export async function createBoard(
  workspaceId: number,
  data: { name: string; description?: string },
): Promise<Board> {
  const res = await api.post<ApiResource<Board>>(`/workspaces/${workspaceId}/boards`, data)
  return res.data.data
}

export async function updateWorkspace(
  id: number,
  data: { name: string; slug: string },
): Promise<Workspace> {
  const res = await api.patch<ApiResource<Workspace>>(`/workspaces/${id}`, data)
  return res.data.data
}

export async function deleteWorkspace(id: number): Promise<void> {
  await api.delete(`/workspaces/${id}`)
}

export async function createColumn(
  workspaceId: number,
  boardId: number,
  data: { name: string; color?: string },
): Promise<BoardColumn> {
  const res = await api.post<ApiResource<BoardColumn>>(
    `/workspaces/${workspaceId}/boards/${boardId}/columns`,
    data,
  )
  return res.data.data
}

export async function updateColumn(
  workspaceId: number,
  boardId: number,
  columnId: number,
  data: { name?: string; color?: string | null },
): Promise<BoardColumn> {
  const res = await api.patch<ApiResource<BoardColumn>>(
    `/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`,
    data,
  )
  return res.data.data
}

export async function deleteColumn(
  workspaceId: number,
  boardId: number,
  columnId: number,
): Promise<void> {
  await api.delete(`/workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`)
}
