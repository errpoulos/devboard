import api from '@/api/axios'
import type { ApiResource, DashboardMetrics } from '@/types'

export async function getDashboard(
  workspaceId: number,
  boardId?: number | null,
): Promise<DashboardMetrics> {
  const { data } = await api.get<ApiResource<DashboardMetrics>>(
    `/workspaces/${workspaceId}/dashboard`,
    { params: boardId ? { board_id: boardId } : undefined },
  )
  return data.data
}
