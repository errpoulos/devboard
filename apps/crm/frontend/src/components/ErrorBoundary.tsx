import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Something went wrong.',
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
          <div className="text-center">
            <p className="text-[15px] font-[510] text-[#f7f8f8] mb-1">Something went wrong</p>
            <p className="text-[13px] text-[#8a8f98]">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="mt-4 text-[12px] text-[#60a5fa] hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
