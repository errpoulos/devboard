import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, getBoards, getBoard, createBoard } from '../api'
import { queryKeys } from '@/api/queryKeys'

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, slug }: { name: string; slug: string }) => createWorkspace(name, slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() }),
  })
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; slug: string } }) =>
      updateWorkspace(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() }),
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteWorkspace(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() }),
  })
}

export function useBoards(workspaceId: number) {
  return useQuery({
    queryKey: queryKeys.boards(workspaceId),
    queryFn: () => getBoards(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useBoard(workspaceId: number, boardId: number) {
  return useQuery({
    queryKey: queryKeys.board(workspaceId, boardId),
    queryFn: () => getBoard(workspaceId, boardId),
    enabled: !!workspaceId && !!boardId,
  })
}

export function useCreateBoard(workspaceId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) => createBoard(workspaceId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.boards(workspaceId) }),
  })
}
