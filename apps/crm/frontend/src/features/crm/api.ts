import api from '@/api/axios'
import type { Company, Contact, Deal, PipelineStage, User } from '@/types'

// Auth
export async function fetchCsrf(): Promise<void> {
  await api.get('/sanctum/csrf-cookie', { baseURL: '/' })
}

export async function login(email: string, password: string): Promise<User> {
  await fetchCsrf()
  const res = await api.post<{ data: User }>('/auth/login', { email, password })
  return res.data.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<{ data: User }>('/auth/me')
  return res.data.data
}

// Companies
export async function fetchCompanies(): Promise<Company[]> {
  const res = await api.get<{ data: Company[] }>('/companies')
  return res.data.data
}

export async function createCompany(data: {
  name: string
  domain?: string
  industry?: string
}): Promise<Company> {
  const res = await api.post<{ data: Company }>('/companies', data)
  return res.data.data
}

export async function deleteCompany(id: number): Promise<void> {
  await api.delete(`/companies/${id}`)
}

// Contacts
export async function fetchContacts(): Promise<Contact[]> {
  const res = await api.get<{ data: Contact[] }>('/contacts')
  return res.data.data
}

export async function createContact(data: {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  company_id?: number
}): Promise<Contact> {
  const res = await api.post<{ data: Contact }>('/contacts', data)
  return res.data.data
}

export async function deleteContact(id: number): Promise<void> {
  await api.delete(`/contacts/${id}`)
}

// Pipeline
export async function fetchPipeline(): Promise<PipelineStage[]> {
  const res = await api.get<{ data: PipelineStage[] }>('/pipeline')
  return res.data.data
}

// Deals
export async function fetchDeals(stageId?: number): Promise<Deal[]> {
  const params = stageId !== undefined ? { stage_id: stageId } : {}
  const res = await api.get<{ data: Deal[] }>('/deals', { params })
  return res.data.data
}

export async function createDeal(data: {
  title: string
  pipeline_stage_id: number
  contact_id?: number
  value?: number
  status?: string
}): Promise<Deal> {
  const res = await api.post<{ data: Deal }>('/deals', data)
  return res.data.data
}

export async function updateDeal(
  id: number,
  data: Partial<{
    title: string
    pipeline_stage_id: number
    contact_id: number | null
    value: number | null
    status: string
    position: number
  }>,
): Promise<Deal> {
  const res = await api.put<{ data: Deal }>(`/deals/${id}`, data)
  return res.data.data
}

export async function deleteDeal(id: number): Promise<void> {
  await api.delete(`/deals/${id}`)
}
