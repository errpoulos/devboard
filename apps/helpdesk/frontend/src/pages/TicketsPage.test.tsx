import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TicketsPage from './TicketsPage'
import type { Ticket } from '@/types'

vi.mock('@/features/tickets/hooks/useTickets', () => ({
  useTickets: vi.fn(),
}))

import { useTickets } from '@/features/tickets/hooks/useTickets'

const mockedUseTickets = useTickets as ReturnType<typeof vi.fn>

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  )
}

const makeTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 1,
  subject: 'Test ticket subject',
  description: 'Some description',
  status: 'open',
  priority: 'medium',
  created_at: '2026-01-15T10:00:00Z',
  ...overrides,
})

describe('TicketsPage', () => {
  it('does not show ticket data rows while loading', () => {
    mockedUseTickets.mockReturnValue({ isLoading: true, isError: false, data: undefined })
    const { container } = render(<TicketsPage />, { wrapper })
    // Skeleton renders tr rows but they contain no ticket subject links
    const ticketLinks = container.querySelectorAll('td a')
    expect(ticketLinks).toHaveLength(0)
    // Should have skeleton rows rendered in a table
    const trs = container.querySelectorAll('tr')
    expect(trs.length).toBeGreaterThan(0)
  })

  it('shows error message when isError is true', () => {
    // Provide empty data to avoid the component crashing when it falls through
    // to the table branch (the component doesn't short-circuit on isError alone)
    mockedUseTickets.mockReturnValue({ isLoading: false, isError: true, data: { data: [] } })
    render(<TicketsPage />, { wrapper })
    expect(screen.getByText(/failed to load tickets/i)).toBeInTheDocument()
  })

  it('shows empty state when data has no tickets', () => {
    mockedUseTickets.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [] },
    })
    render(<TicketsPage />, { wrapper })
    expect(screen.getByText(/no tickets yet/i)).toBeInTheDocument()
  })

  it('renders ticket subjects as links when data is loaded', () => {
    const tickets = [
      makeTicket({ id: 1, subject: 'First ticket', status: 'open', priority: 'low' }),
      makeTicket({ id: 2, subject: 'Second ticket', status: 'resolved', priority: 'high' }),
    ]
    mockedUseTickets.mockReturnValue({ isLoading: false, isError: false, data: { data: tickets } })
    render(<TicketsPage />, { wrapper })
    expect(screen.getByText('First ticket')).toBeInTheDocument()
    expect(screen.getByText('Second ticket')).toBeInTheDocument()
  })

  it('renders status and priority badges for tickets', () => {
    const tickets = [
      makeTicket({ id: 1, subject: 'A ticket', status: 'in_progress', priority: 'urgent' }),
    ]
    mockedUseTickets.mockReturnValue({ isLoading: false, isError: false, data: { data: tickets } })
    render(<TicketsPage />, { wrapper })
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })

  it('shows reply count when replies_count is greater than 0', () => {
    const tickets = [makeTicket({ id: 1, subject: 'Ticket with replies', replies_count: 3 })]
    mockedUseTickets.mockReturnValue({ isLoading: false, isError: false, data: { data: tickets } })
    render(<TicketsPage />, { wrapper })
    expect(screen.getByText(/3\s+replies/i)).toBeInTheDocument()
  })

  it('does not show reply count when replies_count is 0', () => {
    const tickets = [makeTicket({ id: 1, subject: 'Zero replies ticket', replies_count: 0 })]
    mockedUseTickets.mockReturnValue({ isLoading: false, isError: false, data: { data: tickets } })
    render(<TicketsPage />, { wrapper })
    // The reply count span should not be present (the condition is replies_count > 0)
    expect(screen.queryByText(/\d+\s+repl/i)).not.toBeInTheDocument()
  })

  it('shows "1 reply" (singular) when replies_count is 1', () => {
    const tickets = [makeTicket({ id: 1, subject: 'One reply ticket', replies_count: 1 })]
    mockedUseTickets.mockReturnValue({ isLoading: false, isError: false, data: { data: tickets } })
    render(<TicketsPage />, { wrapper })
    expect(screen.getByText(/1\s+reply/i)).toBeInTheDocument()
  })
})
