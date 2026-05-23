import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrgDetailPage from './OrgDetailPage'
import { useOrg, useUpdateOrg, useDeleteUser } from '@/features/admin/hooks/useAdmin'

vi.mock('@/features/admin/hooks/useAdmin', () => ({
  useOrg: vi.fn(),
  useUpdateOrg: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeleteUser: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return { ...actual, useParams: () => ({ id: '1' }), useNavigate: () => vi.fn() }
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

const mockUseOrg = useOrg as ReturnType<typeof vi.fn>

describe('OrgDetailPage', () => {
  beforeEach(() => {
    vi.mocked(useUpdateOrg).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
    vi.mocked(useDeleteUser).mockReturnValue({ mutate: vi.fn(), isPending: false } as any)
  })

  it('shows "Loading..." in loading state', () => {
    mockUseOrg.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<OrgDetailPage />, { wrapper })
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows "Failed to load organization" in error state', () => {
    mockUseOrg.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(<OrgDetailPage />, { wrapper })
    expect(screen.getByText(/Failed to load organization/i)).toBeInTheDocument()
  })

  it('renders org name, plan badge, and user name when loaded', () => {
    mockUseOrg.mockReturnValue({
      data: {
        data: {
          id: 1,
          name: 'Acme Corp',
          slug: 'acme',
          plan: 'pro',
          status: 'active',
          created_at: '2026-01-01T00:00:00Z',
          users_count: 1,
          users: [
            {
              id: 10,
              name: 'Bob Smith',
              email: 'bob@acme.com',
              is_super_admin: false,
              created_at: '',
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
    })
    render(<OrgDetailPage />, { wrapper })

    // Org name visible as heading
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()

    // Plan badge (uppercase span text) — may also appear as an <option> value
    // so we use getAllByText and assert at least one match
    expect(screen.getAllByText('pro').length).toBeGreaterThan(0)

    // User name visible in members table
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
  })
})
