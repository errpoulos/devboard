export interface Company {
  id: number
  name: string
  domain?: string
  industry?: string
}

export interface Contact {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company?: Company
}

export interface PipelineStage {
  id: number
  name: string
  position: number
  deals?: Deal[]
}

export interface Deal {
  id: number
  title: string
  value?: number
  status: string
  position: number
  stage_id: number
  contact?: Contact
}

export interface User {
  id: number
  name: string
  email: string
  organization_id?: number
  is_super_admin?: boolean
}

export interface ClientNote {
  id: number
  category: 'sales' | 'support'
  body: string
  created_at: string
  author?: User
}
