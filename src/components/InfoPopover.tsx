import type { ReactNode } from 'react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'

/** Small "i" button that opens a floating info panel. */
export function InfoPopover({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Popover className="shrink-0">
      <PopoverButton
        onClick={(e) => e.stopPropagation()} // don't trigger the card/row underneath
        aria-label={label}
        className="grid h-6 w-6 place-items-center rounded-full bg-slate-900/70 text-xs font-bold text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
      >
        i
      </PopoverButton>
      {/* portal → set colours explicitly */}
      <PopoverPanel
        anchor="top end"
        className="z-50 w-72 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 shadow-xl [--anchor-gap:6px]"
      >
        {children}
      </PopoverPanel>
    </Popover>
  )
}
