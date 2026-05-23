import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrgsPage from './OrgsPage'
import { useOrgs, useUpdateOrg, useDeleteOrg } from '@/features/admin/hooks/useAdmin'

vi.mock('@/features/admin/hooks/useAdmin', () => ({
  useOrgs: vi.fn(),
  useUpdateOrg: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteOrg: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useCreateOrg: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useNavigate: () => vi.fn() }
})

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

const mockUseOrgs = useOrgs as ReturnType<typeof vi.fn>

describe('OrgsPage', () => {
  beforeEach(() => {
    vi.mocked(useUpdateOrg).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
    vi.mocked(useDeleteOrg).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
  })

  it('shows skeleton tds in loading state', () => {
    mockUseOrgs.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    const { container } = render(<OrgsPage />, { wrapper })
    // TableRowSkeleton renders tds — check at least one is present
    expect(container.querySelectorAll('td').length).toBeGreaterThan(0)
  })

  it('shows error message when loading fails', () => {
    mockUseOrgs.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<OrgsPage />, { wrapper })
    expect(screen.getByText(/Failed to load organizations/i)).toBeInTheDocument()
  })

  it('renders org name when data is loaded', () => {
    mockUseOrgs.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Acme Corp',
            slug: 'acme',
            plan: 'pro',
            status: 'active',
            created_at: '2026-01-01T00:00:00Z',
            users_count: 5,
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
        links: { first: null, last: null, prev: null, next: null },
      },
      isLoading: false,
      isError: false,
    })
    render(<OrgsPage />, { wrapper })
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('shows the plan badge text', () => {
    mockUseOrgs.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Acme Corp',
            slug: 'acme',
            plan: 'pro',
            status: 'active',
            created_at: '2026-01-01T00:00:00Z',
            users_count: 5,
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
        links: { first: null, last: null, prev: null, next: null },
      },
      isLoading: false,
      isError: false,
    })
    render(<OrgsPage />, { wrapper })
    // The plan select should have "pro" as the selected value
    const planSelect = screen.getByDisplayValue('pro')
    expect(planSelect).toBeInTheDocument()
  })
})
