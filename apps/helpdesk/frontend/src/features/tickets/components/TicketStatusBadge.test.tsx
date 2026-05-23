import { render, screen } from '@testing-library/react'
import TicketStatusBadge from './TicketStatusBadge'

describe('TicketStatusBadge', () => {
  it('renders "Open" for open status', () => {
    render(<TicketStatusBadge status="open" />)
    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('renders "In Progress" for in_progress status', () => {
    render(<TicketStatusBadge status="in_progress" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('renders "Resolved" for resolved status', () => {
    render(<TicketStatusBadge status="resolved" />)
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('renders "Closed" for closed status', () => {
    render(<TicketStatusBadge status="closed" />)
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })
})
