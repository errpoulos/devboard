export interface User {
  id: number
  name: string
  email: string
  role?: 'agent' | 'administrator' | 'customer' | null
  is_admin?: boolean
  tickets_count?: number
  organizations?: Organization[]
}

export interface CustomerDetail extends User {
  tickets: Ticket[]
  notes: ClientNote[]
}

export interface Organization {
  id: number
  name: string
  slug: string
  plan: string
  status: string
}

export interface TicketAttachment {
  id: number
  filename: string
  mime_type: string
  size: number
  created_at: string
  uploader?: User
}

export interface ClientNote {
  id: number
  category: 'sales' | 'support'
  body: string
  created_at: string
  author?: User
}

export interface DevboardTask {
  task_id: number
  column: string
  comments: Array<{
    id: number
    body: string
    author: string
    created_at: string
  }>
}

export interface Ticket {
  id: number
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  type?: 'support_request' | 'bug_report' | 'feature_request'
  assigned_to?: User
  devboard_task_id?: number
  devboard_task?: DevboardTask
  user?: User
  replies_count?: number
  customer_notes?: ClientNote[]
  org_notes?: ClientNote[]
  attachments?: TicketAttachment[]
  created_at: string
}

export interface TicketReply {
  id: number
  body: string
  is_private?: boolean
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
