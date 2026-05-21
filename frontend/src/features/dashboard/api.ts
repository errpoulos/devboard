import api from '@/api/axios'
import type { ApiResource, DashboardMetrics } from '@/types'

export async function getDashboard(workspaceId: number): Promise<DashboardMetrics> {
  const { data } = await api.get<ApiResource<DashboardMetrics>>(
    `/workspaces/${workspaceId}/dashboard`,
  )
  return data.data
}
