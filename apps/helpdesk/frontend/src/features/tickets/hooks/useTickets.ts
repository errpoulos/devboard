import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import {
  addTeamMember,
  createReply,
  createTicket,
  createUserNote,
  deleteAttachment,
  deleteNote,
  deleteTicket,
  getAgents,
  getAttachments,
  getCustomer,
  getCustomers,
  getReplies,
  getTeam,
  getTicket,
  getTickets,
  removeTeamMember,
  updateNote,
  updateTeamMember,
  updateTicket,
  uploadAttachment,
} from '@/features/tickets/api'
import type { TicketFilters } from '@/features/tickets/api'

export function useTickets(filters?: TicketFilters) {
  return useQuery({
    queryKey: queryKeys.tickets(filters as Record<string, unknown>),
    queryFn: () => getTickets(filters),
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
    mutationFn: (data: { body: string; is_private?: boolean }) => createReply(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.replies(ticketId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) })
    },
  })
}

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents(),
    queryFn: getAgents,
  })
}

export function useAttachments(ticketId: number) {
  return useQuery({
    queryKey: queryKeys.attachments(ticketId),
    queryFn: () => getAttachments(ticketId),
  })
}

export function useUploadAttachment(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadAttachment(ticketId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments(ticketId) })
    },
  })
}

export function useDeleteAttachment(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attachmentId: number) => deleteAttachment(ticketId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments(ticketId) })
    },
  })
}

export function useCreateUserNote(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) => createUserNote(userId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userNotes(userId) })
    },
  })
}

export function useUpdateNote(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: number; body: string }) => updateNote(noteId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userNotes(userId) })
    },
  })
}

export function useDeleteNote(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noteId: number) => deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userNotes(userId) })
    },
  })
}

export function useTeam() {
  return useQuery({
    queryKey: queryKeys.team(),
    queryFn: getTeam,
  })
}

export function useAddTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, name, role }: { email: string; name: string; role: string }) =>
      addTeamMember(email, name, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team() })
    },
  })
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: Partial<{ name: string; role: string }> }) =>
      updateTeamMember(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team() })
    },
  })
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => removeTeamMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team() })
    },
  })
}

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers(),
    queryFn: getCustomers,
  })
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => getCustomer(id),
  })
}
