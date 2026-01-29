'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'

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
          <AlertTriangle className="h-12 w-12 text-[var(--warning)] mb-4" />
          <h2 className="text-lg font-semibold text-[var(--navy-dark)] mb-2">
            Er is iets misgegaan
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] text-center mb-4 max-w-md">
            Er is een fout opgetreden bij het laden van deze sectie.
            Probeer de pagina te vernieuwen of neem contact op met support als het probleem aanhoudt.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 text-sm font-medium bg-[var(--navy-dark)] text-white rounded-lg hover:bg-[var(--navy-medium)] transition-colors"
            >
              Opnieuw proberen
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-white transition-colors"
            >
              Pagina vernieuwen
            </button>
          </div>
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
