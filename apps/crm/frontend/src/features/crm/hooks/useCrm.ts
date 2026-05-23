import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import {
  createCompany,
  createContact,
  createDeal,
  deleteCompany,
  deleteContact,
  deleteDeal,
  fetchCompanies,
  fetchContacts,
  fetchPipeline,
  updateDeal,
} from '../api'

// Companies
export function useCompanies() {
  return useQuery({
    queryKey: queryKeys.companies(),
    queryFn: fetchCompanies,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies() })
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies() })
    },
  })
}

// Contacts
export function useContacts() {
  return useQuery({
    queryKey: queryKeys.contacts(),
    queryFn: fetchContacts,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts() })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts() })
    },
  })
}

// Pipeline
export function usePipeline() {
  return useQuery({
    queryKey: queryKeys.pipeline(),
    queryFn: fetchPipeline,
  })
}

// Deals
export function useCreateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pipeline() })
    },
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateDeal>[1] }) =>
      updateDeal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pipeline() })
    },
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pipeline() })
    },
  })
}
