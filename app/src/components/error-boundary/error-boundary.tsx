'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { ErrorReport } from './error-report'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component to catch and handle React rendering errors.
 * Prevents the entire app from crashing when a component throws an error.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)

    // Track via analytics (direct sendBeacon — class components can't use hooks)
    try {
      const payload = {
        events: [{
          event_type: 'error',
          properties: {
            message: error.message,
            trigger: 'react_render',
          },
          timestamp: new Date().toISOString(),
        }],
      }
      const blob = new Blob([JSON.stringify(payload)], { type: 'text/plain' })
      if (!navigator.sendBeacon('/api/v1/events', blob)) {
        fetch('/api/v1/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
          credentials: 'same-origin',
        }).catch(() => {})
      }
    } catch {
      // Silently ignore — analytics should never make error recovery worse
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-[var(--gray-light)] rounded-lg">
          <ErrorReport />
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full max-w-lg">
              <summary className="text-xs text-[var(--muted-foreground)] cursor-pointer">
                Technische details (development)
              </summary>
              <pre className="mt-2 p-3 bg-red-50 text-red-800 text-xs rounded overflow-auto max-h-32">
                {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
