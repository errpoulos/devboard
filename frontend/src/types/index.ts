export interface User {
  id: number
  name: string
  email: string
  is_super_admin?: boolean
  created_at: string
}

export interface Workspace {
  id: number
  name: string
  slug: string
  owner?: User
  members_count?: number
  created_at: string
}

export interface BoardColumn {
  id: number
  board_id: number
  name: string
  position: number
  color: string | null
  tasks?: Task[]
}

export interface Board {
  id: number
  workspace_id: number
  name: string
  description: string | null
  columns?: BoardColumn[]
  created_at: string
}

export interface Attachment {
  id: number
  filename: string
  mime_type: string
  size: number
  created_at: string
  uploader?: User
}

export interface Task {
  id: number
  workspace_id: number
  board_column_id: number
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  story_points?: number | null
  position: number
  due_at: string | null
  completed_at: string | null
  helpdesk_ticket_id?: number | null
  assignee?: User
  comments_count?: number
  attachments_count?: number
  attachments?: Attachment[]
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  task_id: number
  body: string
  user?: User
  created_at: string
  updated_at: string
}

export interface Invitation {
  id: number
  workspace_id: number
  email: string
  role: string
  accepted_at: string | null
  expires_at: string
  inviter?: User
  created_at: string
}

export interface DashboardStatusItem {
  column: string
  color: string | null
  count: number
}

export interface DashboardAvgTimeItem {
  column: string
  color: string | null
  avg_hours: number
}

export interface DashboardMetrics {
  workspace_id: number
  tasks_by_status: DashboardStatusItem[]
  avg_time_per_status: DashboardAvgTimeItem[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    next_cursor: string | null
    per_page: number
  }
}

export interface ApiResource<T> {
  data: T
}
