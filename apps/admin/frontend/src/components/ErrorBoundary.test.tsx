import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>OK</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('OK')).toBeInTheDocument()
  })

  it('shows "Something went wrong" when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('"Try again" button resets the error state', () => {
    // Use a ref-like approach: a wrapper that can swap whether the child throws
    let shouldThrow = true

    function ControlledThrower() {
      if (shouldThrow) throw new Error('Test error')
      return <div>OK</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ControlledThrower />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Stop throwing before clicking Try again, then re-render after reset
    shouldThrow = false
    fireEvent.click(screen.getByText('Try again'))

    rerender(
      <ErrorBoundary>
        <ControlledThrower />
      </ErrorBoundary>,
    )

    expect(screen.getByText('OK')).toBeInTheDocument()
  })
})
