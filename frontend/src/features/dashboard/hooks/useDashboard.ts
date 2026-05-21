import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import { getDashboard } from '../api'

export function useDashboard(workspaceId: number | null, boardId?: number | null) {
  return useQuery({
    queryKey: queryKeys.dashboard(workspaceId ?? 0, boardId),
    queryFn: () => getDashboard(workspaceId!, boardId),
    enabled: workspaceId !== null,
  })
}
