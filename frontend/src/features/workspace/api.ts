import api from '@/api/axios'
import type { ApiResource, Board, Workspace } from '@/types'

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
