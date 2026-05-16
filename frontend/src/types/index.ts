export interface User {
  id: number
  name: string
  email: string
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

export interface Task {
  id: number
  workspace_id: number
  board_column_id: number
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  position: number
  due_at: string | null
  completed_at: string | null
  assignee?: User
  comments_count?: number
  attachments_count?: number
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
