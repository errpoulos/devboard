export interface Organization {
  id: number
  name: string
  slug: string
  plan: string
  status: string
  users_count?: number
  created_at: string
}

export interface User {
  id: number
  name: string
  email: string
  is_super_admin: boolean
  organization?: Organization
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
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}
