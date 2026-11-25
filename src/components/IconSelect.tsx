import { useState } from 'react'
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react'
import { itemIcon } from '../lib/sprites'

export interface IconOption {
  id: string
  name: string
  icon?: string
}

interface Props {
  options: IconOption[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  noneLabel?: string
}

/** Searchable dropdown with an icon per option (held items, Poké Balls). */
export function IconSelect({
  options,
  value,
  onChange,
  disabled,
  noneLabel = '— None —',
}: Props) {
  const [query, setQuery] = useState('')
  const selected = options.find((o) => o.id === value) ?? null
  const q = query.trim().toLowerCase()
  const filtered = q
    ? options.filter((o) => o.name.toLowerCase().includes(q))
    : options

  return (
    <Combobox
      value={selected}
      onChange={(o: IconOption | null) => onChange(o?.id ?? '')}
      onClose={() => setQuery('')}
      disabled={disabled}
      immediate // open on focus
    >
      <div className="relative">
        {selected?.icon && (
          <img
            src={itemIcon(selected.icon)}
            alt=""
            className="pointer-events-none absolute left-1.5 top-1/2 h-7 w-7 -translate-y-1/2 [image-rendering:pixelated]"
          />
        )}
        <ComboboxInput
          displayValue={(o: IconOption | null) => o?.name ?? ''}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={noneLabel}
          className={`w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pr-8 text-sm disabled:opacity-40 ${
            selected?.icon ? 'pl-10' : 'pl-2'
          }`}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 px-2 text-slate-400">
          ▾
        </ComboboxButton>
      </div>

      <ComboboxOptions
        anchor="bottom start"
        className="z-50 max-h-72 w-(--input-width) overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-1 [--anchor-gap:4px] empty:invisible"
      >
        <ComboboxOption
          value={null}
          className="cursor-pointer rounded px-2 py-1.5 text-sm text-slate-400 data-focus:bg-slate-800"
        >
          {noneLabel}
        </ComboboxOption>
        {filtered.map((o) => (
          <ComboboxOption
            key={o.id}
            value={o}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm data-focus:bg-slate-800 data-selected:text-red-400"
          >
            {o.icon ? (
              <img
                src={itemIcon(o.icon)}
                alt=""
                loading="lazy"
                className="h-7 w-7 [image-rendering:pixelated]"
              />
            ) : (
              <span className="h-7 w-7" />
            )}
            {o.name}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  )
}
