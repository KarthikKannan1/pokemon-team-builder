import { useEffect } from 'react'
import { useUi } from '../store/ui'

/** Short message at the bottom; disappears after 4 seconds. */
export function Toast() {
  const notice = useUi((s) => s.notice)
  const notify = useUi((s) => s.notify)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => notify(null), 4000)
    return () => clearTimeout(timer) // a newer message restarts the timer
  }, [notice, notify])

  if (!notice) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100 shadow-xl ring-1 ring-slate-600"
    >
      <span>{notice}</span>
      <button
        onClick={() => notify(null)}
        className="text-slate-400 hover:text-slate-100"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
