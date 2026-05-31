import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskCard from './TaskCard'
import type { Task } from '@/types'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    workspace_id: 1,
    board_column_id: 10,
    title: 'Fix the login bug',
    description: null,
    priority: 'medium',
    position: 0,
    due_at: null,
    completed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('TaskCard', () => {
  it('renders the task title', () => {
    render(<TaskCard task={makeTask()} />)
    expect(screen.getByText('Fix the login bug')).toBeInTheDocument()
  })

  it('renders the priority badge', () => {
    render(<TaskCard task={makeTask({ priority: 'urgent' })} />)
    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })

  it('renders story points when set', () => {
    render(<TaskCard task={makeTask({ story_points: 5 })} />)
    expect(screen.getByText('5 SP')).toBeInTheDocument()
  })

  it('does not render story points when null', () => {
    render(<TaskCard task={makeTask({ story_points: null })} />)
    expect(screen.queryByText(/SP/)).not.toBeInTheDocument()
  })

  it('renders the due date', () => {
    render(<TaskCard task={makeTask({ due_at: '2099-06-15T12:00:00Z' })} />)
    expect(screen.getByText(/Jun 15/)).toBeInTheDocument()
  })

  it('shows overdue indicator when due date is in the past and task is incomplete', () => {
    render(<TaskCard task={makeTask({ due_at: '2020-01-01T00:00:00Z', completed_at: null })} />)
    expect(screen.getByText(/⚠/)).toBeInTheDocument()
  })

  it('does not show overdue indicator when task is completed', () => {
    render(
      <TaskCard
        task={makeTask({ due_at: '2020-01-01T00:00:00Z', completed_at: '2026-01-01T00:00:00Z' })}
      />,
    )
    expect(screen.queryByText(/⚠/)).not.toBeInTheDocument()
  })

  it('applies completed styling when task is done', () => {
    const { container } = render(
      <TaskCard task={makeTask({ completed_at: '2026-01-01T00:00:00Z' })} />,
    )
    expect(container.firstChild).toHaveClass('opacity-50')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<TaskCard task={makeTask()} onClick={onClick} />)
    await userEvent.click(screen.getByText('Fix the login bug'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders assignee name when no due date is set', () => {
    render(
      <TaskCard
        task={makeTask({ assignee: { id: 99, name: 'Jane Doe', email: 'j@test.com', created_at: '' } })}
      />,
    )
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })
})
