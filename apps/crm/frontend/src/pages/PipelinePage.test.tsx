import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import type { PipelineStage } from '@/types'

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PointerSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: vi.fn(),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

vi.mock('@/features/crm/hooks/useCrm', () => ({
  usePipeline: vi.fn(),
  useCreateDeal: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateDeal: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

import { usePipeline } from '@/features/crm/hooks/useCrm'
import PipelinePage from './PipelinePage'

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PipelinePage', () => {
  it('shows skeleton columns while loading', () => {
    vi.mocked(usePipeline).mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof usePipeline>)
    const { container } = render(<PipelinePage />, { wrapper })
    const pulseEls = container.querySelectorAll('.animate-pulse')
    expect(pulseEls.length).toBeGreaterThan(0)
  })

  it('shows "No pipeline stages" when data is empty', () => {
    vi.mocked(usePipeline).mockReturnValue({ data: [], isLoading: false } as ReturnType<typeof usePipeline>)
    render(<PipelinePage />, { wrapper })
    expect(screen.getByText(/no pipeline stages/i)).toBeInTheDocument()
  })

  it('renders stage names when loaded', () => {
    const stages: PipelineStage[] = [
      { id: 1, name: 'Qualified', position: 1, deals: [] },
      { id: 2, name: 'Closed Won', position: 2, deals: [] },
    ]
    vi.mocked(usePipeline).mockReturnValue({ data: stages, isLoading: false } as ReturnType<typeof usePipeline>)
    render(<PipelinePage />, { wrapper })
    expect(screen.getByText('Qualified')).toBeInTheDocument()
    expect(screen.getByText('Closed Won')).toBeInTheDocument()
  })

  it('shows deal count per stage', () => {
    const stages: PipelineStage[] = [
      {
        id: 1,
        name: 'Prospecting',
        position: 1,
        deals: [
          { id: 10, title: 'Deal A', status: 'open', position: 1, stage_id: 1 },
          { id: 11, title: 'Deal B', status: 'open', position: 2, stage_id: 1 },
        ],
      },
    ]
    vi.mocked(usePipeline).mockReturnValue({ data: stages, isLoading: false } as ReturnType<typeof usePipeline>)
    render(<PipelinePage />, { wrapper })
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows total value for a stage that has deals with values', () => {
    const stages: PipelineStage[] = [
      {
        id: 1,
        name: 'Negotiation',
        position: 1,
        deals: [
          { id: 20, title: 'Big Deal', value: 5000, status: 'open', position: 1, stage_id: 1 },
          { id: 21, title: 'Small Deal', value: 3000, status: 'open', position: 2, stage_id: 1 },
        ],
      },
    ]
    vi.mocked(usePipeline).mockReturnValue({ data: stages, isLoading: false } as ReturnType<typeof usePipeline>)
    render(<PipelinePage />, { wrapper })
    // Total = $8,000
    expect(screen.getByText('$8,000')).toBeInTheDocument()
  })

  it('shows "+ Add deal" button for each stage', () => {
    const stages: PipelineStage[] = [
      { id: 1, name: 'Stage A', position: 1, deals: [] },
      { id: 2, name: 'Stage B', position: 2, deals: [] },
    ]
    vi.mocked(usePipeline).mockReturnValue({ data: stages, isLoading: false } as ReturnType<typeof usePipeline>)
    render(<PipelinePage />, { wrapper })
    const addButtons = screen.getAllByText('+ Add deal')
    expect(addButtons).toHaveLength(2)
  })
})
