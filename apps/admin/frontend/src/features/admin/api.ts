import api from '@/api/axios'
import type { Organization, PaginatedResponse, User } from '@/types'

export async function getOrgs(page = 1): Promise<PaginatedResponse<Organization>> {
  const res = await api.get('/organizations', { params: { page } })
  return res.data
}

export async function getOrg(id: number): Promise<{ data: Organization & { users?: User[] } }> {
  const res = await api.get(`/organizations/${id}`)
  return res.data
}

export async function updateOrg(
  id: number,
  data: { plan?: string; status?: string },
): Promise<{ data: Organization }> {
  const res = await api.patch(`/organizations/${id}`, data)
  return res.data
}

export async function deleteOrg(id: number): Promise<void> {
  await api.delete(`/organizations/${id}`)
}

export async function getUsers(orgId?: number, page = 1): Promise<PaginatedResponse<User>> {
  const params: Record<string, unknown> = { page }
  if (orgId) params.organization_id = orgId
  const res = await api.get('/users', { params })
  return res.data
}

export async function updateUser(
  id: number,
  data: { is_super_admin?: boolean; organization_id?: number | null },
): Promise<{ data: User }> {
  const res = await api.patch(`/users/${id}`, data)
  return res.data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}
