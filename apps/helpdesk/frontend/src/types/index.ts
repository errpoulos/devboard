export interface User {
  id: number
  name: string
  email: string
}

export interface Organization {
  id: number
  name: string
  slug: string
  plan: string
  status: string
}

export interface Ticket {
  id: number
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  user?: User
  replies_count?: number
  created_at: string
}

export interface TicketReply {
  id: number
  body: string
  user?: User
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
