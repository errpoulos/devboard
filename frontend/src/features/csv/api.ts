import api from '@/api/axios'

export interface ImportResult {
  created: number
  failed: number
  errors: { row: number; message: string }[]
}

export async function importBoards(workspaceId: number, file: File): Promise<ImportResult> {
  const body = new FormData()
  body.append('file', file)
  const res = await api.post<{ data: ImportResult }>(
    `/workspaces/${workspaceId}/boards/import`,
    body,
  )
  return res.data.data
}

export async function importTasks(
  workspaceId: number,
  boardId: number,
  file: File,
): Promise<ImportResult> {
  const body = new FormData()
  body.append('file', file)
  const res = await api.post<{ data: ImportResult }>(
    `/workspaces/${workspaceId}/boards/${boardId}/tasks/import`,
    body,
  )
  return res.data.data
}
