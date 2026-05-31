import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryKeys'
import {
  createCompany,
  createCompanyNote,
  createContact,
  createContactNote,
  createDeal,
  deleteCompany,
  deleteContact,
  deleteDeal,
  deleteNote,
  fetchCompanies,
  fetchCompanyNotes,
  fetchContactNotes,
  fetchContacts,
  fetchPipeline,
  updateDeal,
  updateNote,
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

// Contact notes
export function useContactNotes(contactId: number) {
  return useQuery({
    queryKey: queryKeys.contactNotes(contactId),
    queryFn: () => fetchContactNotes(contactId),
  })
}

export function useCreateContactNote(contactId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => createContactNote(contactId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contactNotes(contactId) })
    },
  })
}

// Company notes
export function useCompanyNotes(companyId: number) {
  return useQuery({
    queryKey: queryKeys.companyNotes(companyId),
    queryFn: () => fetchCompanyNotes(companyId),
  })
}

export function useCreateCompanyNote(companyId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => createCompanyNote(companyId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companyNotes(companyId) })
    },
  })
}

// Shared note mutations
export function useUpdateNote(invalidateKey: readonly unknown[]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: number; body: string }) => updateNote(noteId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey as string[] })
    },
  })
}

export function useDeleteNote(invalidateKey: readonly unknown[]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (noteId: number) => deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey as string[] })
    },
  })
}
