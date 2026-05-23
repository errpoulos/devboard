import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import React from 'react'
import type { Contact } from '@/types'

vi.mock('@/features/crm/hooks/useCrm', () => ({
  useContacts: vi.fn(),
  useCreateContact: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteContact: vi.fn(() => ({ mutate: vi.fn() })),
  useCompanies: vi.fn(() => ({ data: [] })),
}))

import { useContacts } from '@/features/crm/hooks/useCrm'
import ContactsPage from './ContactsPage'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <MemoryRouter>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ContactsPage', () => {
  it('shows skeleton while loading', () => {
    vi.mocked(useContacts).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof useContacts>)
    const { container } = render(<ContactsPage />, { wrapper })
    const pulseEls = container.querySelectorAll('.animate-pulse')
    expect(pulseEls.length).toBeGreaterThan(0)
  })

  it('shows empty state when there are no contacts', () => {
    vi.mocked(useContacts).mockReturnValue({ data: [], isLoading: false } as ReturnType<typeof useContacts>)
    render(<ContactsPage />, { wrapper })
    expect(screen.getByText(/no contacts yet/i)).toBeInTheDocument()
  })

  it('renders contact names when loaded', () => {
    const contacts: Contact[] = [
      { id: 1, first_name: 'Alice', last_name: 'Chen' },
    ]
    vi.mocked(useContacts).mockReturnValue({ data: contacts, isLoading: false } as ReturnType<typeof useContacts>)
    render(<ContactsPage />, { wrapper })
    expect(screen.getByText('Alice Chen')).toBeInTheDocument()
  })
})
