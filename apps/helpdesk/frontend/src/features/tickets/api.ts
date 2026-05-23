import api from '@/api/axios'
import type { PaginatedResponse, Ticket, TicketReply } from '@/types'

export function getTickets(): Promise<PaginatedResponse<Ticket>> {
  return api.get('/tickets').then((res) => res.data)
}

export function getTicket(id: number): Promise<{ data: Ticket }> {
  return api.get(`/tickets/${id}`).then((res) => res.data)
}

export function createTicket(data: {
  subject: string
  description: string
  priority: string
}): Promise<{ data: Ticket }> {
  return api.post('/tickets', data).then((res) => res.data)
}

export function updateTicket(
  id: number,
  data: Partial<{ subject: string; description: string; status: string; priority: string }>,
): Promise<{ data: Ticket }> {
  return api.patch(`/tickets/${id}`, data).then((res) => res.data)
}

export function deleteTicket(id: number): Promise<void> {
  return api.delete(`/tickets/${id}`).then(() => undefined)
}

export function getReplies(ticketId: number): Promise<{ data: TicketReply[] }> {
  return api.get(`/tickets/${ticketId}/replies`).then((res) => res.data)
}

export function createReply(
  ticketId: number,
  data: { body: string },
): Promise<{ data: TicketReply }> {
  return api.post(`/tickets/${ticketId}/replies`, data).then((res) => res.data)
}
