import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import {
  createReply,
  createTicket,
  deleteTicket,
  getReplies,
  getTicket,
  getTickets,
  updateTicket,
} from '@/features/tickets/api'

export function useTickets() {
  return useQuery({
    queryKey: queryKeys.tickets(),
    queryFn: getTickets,
  })
}

export function useTicket(id: number) {
  return useQuery({
    queryKey: queryKeys.ticket(id),
    queryFn: () => getTicket(id),
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets() })
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateTicket>[1] }) =>
      updateTicket(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets() })
    },
  })
}

export function useDeleteTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets() })
    },
  })
}

export function useReplies(ticketId: number) {
  return useQuery({
    queryKey: queryKeys.replies(ticketId),
    queryFn: () => getReplies(ticketId),
  })
}

export function useCreateReply(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { body: string }) => createReply(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.replies(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) })
    },
  })
}
