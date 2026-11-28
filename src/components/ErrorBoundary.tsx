import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Catches errors thrown while React renders the app and shows a friendly
 * screen with a reload button instead of a blank page.
 *
 * It has to be a class: React only offers the "catch a render error" hooks
 * (getDerivedStateFromError / componentDidCatch) to class components.
 * Errors in event handlers, timers or promises are not render errors, so they
 * don't reach this; those keep working (or failing) as before.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // keep the details in the console for debugging
    console.error('App crashed while rendering:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100"
      >
        <div className="max-w-md space-y-4 rounded-2xl bg-slate-900 p-6 text-center shadow-xl ring-1 ring-slate-800">
          <h1 className="text-lg font-bold">Something went wrong</h1>
          <p className="text-sm text-slate-400">
            The page hit an unexpected error. Your teams are saved in this
            browser, so reloading should bring everything back.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold hover:bg-sky-500"
          >
            Reload
          </button>
          <details className="text-left text-xs text-slate-500">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
