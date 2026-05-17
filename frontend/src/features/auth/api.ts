import api from '@/api/axios'
import type { ApiResource, User } from '@/types'

export async function csrfCookie() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8001'
  await api.get('/sanctum/csrf-cookie', { baseURL: backendUrl })
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
