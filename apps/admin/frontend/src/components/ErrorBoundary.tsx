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
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9375rem', fontWeight: 510, color: 'var(--text-primary)', marginBottom: 4 }}>
              Something went wrong
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              style={{ marginTop: 16, fontSize: '0.75rem', color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer' }}
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
