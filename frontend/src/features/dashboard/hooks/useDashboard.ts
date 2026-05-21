import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import { getDashboard } from '../api'

export function useDashboard(workspaceId: number | null) {
  return useQuery({
    queryKey: queryKeys.dashboard(workspaceId ?? 0),
    queryFn: () => getDashboard(workspaceId!),
    enabled: workspaceId !== null,
  })
}
