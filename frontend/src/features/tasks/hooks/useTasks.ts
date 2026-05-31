import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTask,
  deleteAttachment,
  deleteTask,
  getAttachments,
  reorderTasks,
  updateTask,
  uploadAttachment,
} from '../api'
import { queryKeys } from '@/api/queryKeys'

export function useCreateTask(workspaceId: number, boardId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof createTask>[2]) =>
      createTask(workspaceId, boardId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.board(workspaceId, boardId) }),
  })
}

export function useUpdateTask(workspaceId: number, boardId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: Parameters<typeof updateTask>[3] }) =>
      updateTask(workspaceId, boardId, taskId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.board(workspaceId, boardId) }),
  })
}

export function useDeleteTask(workspaceId: number, boardId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: number) => deleteTask(workspaceId, boardId, taskId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.board(workspaceId, boardId) }),
  })
}

export function useReorderTasks(workspaceId: number, boardId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, orderedIds }: { columnId: number; orderedIds: number[] }) =>
      reorderTasks(workspaceId, boardId, columnId, orderedIds),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.board(workspaceId, boardId) }),
  })
}

export function useTaskAttachments(workspaceId: number, boardId: number, taskId: number) {
  return useQuery({
    queryKey: queryKeys.attachments(taskId),
    queryFn: () => getAttachments(workspaceId, boardId, taskId),
  })
}

export function useUploadTaskAttachment(workspaceId: number, boardId: number, taskId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(workspaceId, boardId, taskId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments(taskId) }),
  })
}

export function useDeleteTaskAttachment(workspaceId: number, boardId: number, taskId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: number) => deleteAttachment(workspaceId, boardId, taskId, attachmentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments(taskId) }),
  })
}
