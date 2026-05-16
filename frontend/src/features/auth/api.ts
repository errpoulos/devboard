import api from '@/api/axios'
import type { ApiResource, User } from '@/types'

export async function csrfCookie() {
  await api.get('/sanctum/csrf-cookie', { baseURL: '' })
}

export async function login(email: string, password: string): Promise<User> {
  await csrfCookie()
  const res = await api.post<ApiResource<User>>('/auth/login', { email, password })
  return res.data.data
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const res = await api.get<ApiResource<User>>('/auth/me')
  return res.data.data
}
