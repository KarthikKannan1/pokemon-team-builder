import { useEffect, useMemo, useState } from 'react'
import { GROUP_LABEL, sourceLabel } from '../../lib/moveLabels'
import { PICK_GROUP_ORDER, type PickOption } from '../../lib/obtained'
import { TypeBadge } from '../TypeBadge'
import { CategoryIcon, MoveInfo } from './MovesSection'

interface Props {
  options: PickOption[]
  chosen: string[]
  speciesName?: string
  onPick: (id: string) => void
  onClose: () => void
}

/** Same columns for the header and every row → everything lines up. */
const COLS =
  'grid grid-cols-[7.5rem_1fr_4.75rem_2rem_3rem_3rem_2.5rem] items-center gap-3'

/** Sort within a group: level-up by level, TMs by number, the rest A→Z. */
function sortKey(o: PickOption): number {
  const s = o.sources.find((x) => x.group === o.group) ?? o.sources[0]
  if (s.group === 'level') return s.level ?? 0
  if (s.group === 'tm')
    return (
      Number(s.label?.replace(/\D/g, '') ?? 0) +
      (s.label?.startsWith('HM') ? 1000 : 0)
    )
  return 0
}

export function MoveListModal({
  options,
  chosen,
  speciesName,
  onPick,
  onClose,
}: Props) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (o: PickOption) =>
      !q ||
      o.move.name.toLowerCase().includes(q) ||
      o.move.type.toLowerCase() === q
    return PICK_GROUP_ORDER.map((group) => ({
      group,
      items: options
        .filter((o) => o.group === group && match(o))
        .sort(
          (a, b) =>
            sortKey(a) - sortKey(b) || a.move.name.localeCompare(b.move.name),
        ),
    })).filter((g) => g.items.length)
  }, [options, query])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[80vh] w-full max-w-3xl flex-col rounded-2xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 p-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search move or type (e.g. fire)…"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* column headers */}
        <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <div className={`${COLS} flex-1 px-2`}>
            <span>Learned</span>
            <span>Move</span>
            <span className="text-center">Type</span>
            <span className="text-center">Cat.</span>
            <span className="text-right">Pow</span>
            <span className="text-right">Acc</span>
            <span className="text-right">PP</span>
          </div>
          <span className="w-6" />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {groups.length === 0 && (
            <p className="text-center text-slate-500">No moves found.</p>
          )}
          {groups.map(({ group, items }) => (
            <section key={group}>
              <h3 className="sticky top-0 z-10 bg-slate-900 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {GROUP_LABEL[group]}{' '}
                <span className="opacity-60">({items.length})</span>
              </h3>
              <ul className="space-y-1">
                {items.map((o) => {
                  const taken = chosen.includes(o.id)
                  const disabled = !o.available || taken
                  return (
                    <li key={o.id} className="flex items-center gap-2">
                      <button
                        disabled={disabled}
                        onClick={() => onPick(o.id)}
                        title={o.reason}
                        className={`${COLS} flex-1 rounded-lg px-2 py-1.5 text-left text-sm ${
                          taken
                            ? 'bg-red-600/20 text-slate-300'
                            : o.available
                              ? 'hover:bg-slate-800'
                              : 'cursor-not-allowed opacity-40'
                        }`}
                      >
                        <span className="truncate text-xs text-slate-400">
                          {sourceLabel(o, speciesName)}
                        </span>
                        <span className="truncate font-semibold">
                          {o.move.name}
                          {!o.available && (
                            <span className="ml-2 text-xs font-normal text-slate-400">
                              {o.reason}
                            </span>
                          )}
                          {taken && (
                            <span className="ml-2 text-xs font-normal text-red-300">
                              already known
                            </span>
                          )}
                        </span>
                        <TypeBadge type={o.move.type} fixed />
                        <CategoryIcon category={o.move.category} />
                        <span className="text-right font-mono text-xs">
                          {o.move.power ?? '—'}
                        </span>
                        <span className="text-right font-mono text-xs">
                          {o.move.accuracy ?? '—'}
                        </span>
                        <span className="text-right font-mono text-xs">
                          {o.move.pp}
                        </span>
                      </button>
                      <MoveInfo move={o.move} />
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
