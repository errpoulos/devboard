import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importBoards, importTasks } from './api'
import { queryKeys } from '@/api/queryKeys'

export function useImportBoards(workspaceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => importBoards(workspaceId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.boards(workspaceId) }),
  })
}

export function useImportTasks(workspaceId: number, boardId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => importTasks(workspaceId, boardId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.board(workspaceId, boardId) }),
  })
}
