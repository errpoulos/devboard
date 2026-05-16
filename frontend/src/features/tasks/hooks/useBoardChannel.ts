import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import echo from '@/lib/echo'
import { queryKeys } from '@/api/queryKeys'

export function useBoardChannel(workspaceId: number, boardId: number) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = echo.private(`workspace.${workspaceId}`)

    channel
      .listen('TaskCreated', () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.board(workspaceId, boardId) })
      })
      .listen('TaskUpdated', () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.board(workspaceId, boardId) })
      })
      .listen('TaskMoved', () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.board(workspaceId, boardId) })
      })
      .listen('TaskDeleted', () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.board(workspaceId, boardId) })
      })

    return () => {
      echo.leave(`workspace.${workspaceId}`)
    }
  }, [workspaceId, boardId, queryClient])
}
