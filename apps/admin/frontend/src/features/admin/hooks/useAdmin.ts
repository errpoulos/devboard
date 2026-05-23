import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import {
  deleteOrg,
  deleteUser,
  getOrg,
  getOrgs,
  getUsers,
  updateOrg,
  updateUser,
} from '../api'

// --- Organizations ---

export function useOrgs(page = 1) {
  return useQuery({
    queryKey: [...queryKeys.orgs(), page],
    queryFn: () => getOrgs(page),
  })
}

export function useOrg(id: number) {
  return useQuery({
    queryKey: queryKeys.org(id),
    queryFn: () => getOrg(id),
    enabled: !!id,
  })
}

export function useUpdateOrg() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { plan?: string; status?: string } }) =>
      updateOrg(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgs() })
      queryClient.invalidateQueries({ queryKey: queryKeys.org(variables.id) })
    },
  })
}

export function useDeleteOrg() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteOrg(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orgs() })
    },
  })
}

// --- Users ---

export function useUsers(orgId?: number, page = 1) {
  return useQuery({
    queryKey: [...queryKeys.users(orgId), page],
    queryFn: () => getUsers(orgId, page),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { is_super_admin?: boolean; organization_id?: number | null }
    }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
