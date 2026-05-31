import api from '@/api/axios'
import type { ClientNote, CustomerDetail, PaginatedResponse, Ticket, TicketAttachment, TicketReply, User } from '@/types'

export interface TicketFilters {
  status?: string
  type?: string
  priority?: string
  assigned_to?: string | number
  organization_id?: number
  date_from?: string
  date_to?: string
  search?: string
}

export function getTickets(filters?: TicketFilters): Promise<PaginatedResponse<Ticket>> {
  const params: Record<string, string> = {}
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        params[key] = String(value)
      }
    })
  }
  return api.get('/tickets', { params }).then((res) => res.data)
}

export function getTicket(id: number): Promise<{ data: Ticket }> {
  return api.get(`/tickets/${id}`).then((res) => res.data)
}

export function createTicket(data: {
  subject: string
  description: string
  priority: string
  type?: string
  organization_id?: number
}): Promise<{ data: Ticket }> {
  return api.post('/tickets', data).then((res) => res.data)
}

export function updateTicket(
  id: number,
  data: Partial<{
    subject: string
    description: string
    status: string
    priority: string
    type: string
    assigned_to: number | null
  }>,
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
  data: { body: string; is_private?: boolean },
): Promise<{ data: TicketReply }> {
  return api.post(`/tickets/${ticketId}/replies`, data).then((res) => res.data)
}

export function getAgents(): Promise<{ data: User[] }> {
  return api.get('/agents').then((res) => res.data)
}

export function getAttachments(ticketId: number): Promise<{ data: TicketAttachment[] }> {
  return api.get(`/tickets/${ticketId}/attachments`).then((res) => res.data)
}

export function uploadAttachment(ticketId: number, file: File): Promise<{ data: TicketAttachment }> {
  const form = new FormData()
  form.append('file', file)
  return api.post(`/tickets/${ticketId}/attachments`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data)
}

export function deleteAttachment(ticketId: number, attachmentId: number): Promise<void> {
  return api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`).then(() => undefined)
}

export function getUserNotes(userId: number): Promise<{ data: ClientNote[] }> {
  return api.get(`/users/${userId}/notes`).then((res) => res.data)
}

export function createUserNote(userId: number, body: string): Promise<{ data: ClientNote }> {
  return api.post(`/users/${userId}/notes`, { body, category: 'support' }).then((res) => res.data)
}

export function updateNote(noteId: number, body: string): Promise<{ data: ClientNote }> {
  return api.patch(`/notes/${noteId}`, { body }).then((res) => res.data)
}

export function deleteNote(noteId: number): Promise<void> {
  return api.delete(`/notes/${noteId}`).then(() => undefined)
}

export function getTeam(): Promise<{ data: User[] }> {
  return api.get('/team').then((res) => res.data)
}

export function addTeamMember(
  email: string,
  name: string,
  role: string,
): Promise<{ data: User; temp_password?: string }> {
  return api.post('/team', { email, name, role }).then((res) => res.data)
}

export function updateTeamMember(userId: number, data: Partial<{ name: string; role: string }>): Promise<{ data: User }> {
  return api.patch(`/team/${userId}`, data).then((res) => res.data)
}

export function removeTeamMember(userId: number): Promise<void> {
  return api.delete(`/team/${userId}`).then(() => undefined)
}

export function getCustomers(): Promise<PaginatedResponse<User>> {
  return api.get('/customers').then((res) => res.data)
}

export function getCustomer(id: number): Promise<{ data: CustomerDetail }> {
  return api.get(`/customers/${id}`).then((res) => res.data)
}
