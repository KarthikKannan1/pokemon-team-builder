import { TYPE_COLORS } from '../lib/typeColors'

/** `fixed` = same width for every type, so badges line up in lists. */
export function TypeBadge({
  type,
  fixed = false,
}: {
  type: string
  fixed?: boolean
}) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${
        fixed ? 'w-[4.75rem] text-center' : ''
      }`}
      style={{ background: TYPE_COLORS[type] ?? '#666' }}
    >
      {type}
    </span>
  )
}
