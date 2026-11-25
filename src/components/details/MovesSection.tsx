import { useMemo, useState } from 'react'
import { useCore, useGame, useGameGen, useMons } from '../../lib/data'
import { moveOptions } from '../../lib/legality'
import {
  applyObtained,
  selectedEventMoves,
  speciesEvents,
  type PickOption,
} from '../../lib/obtained'
import { TYPE_COLORS } from '../../lib/typeColors'
import type { GenMove, Pokemon } from '../../lib/types'
import { InfoPopover } from '../InfoPopover'
import { TypeBadge } from '../TypeBadge'
import { MoveListModal } from './MoveListModal'

const CATEGORY_COLOR: Record<GenMove['category'], string> = {
  Physical: '#eb5628',
  Special: '#2266cc',
  Status: '#8c888c',
}

/** Game-style category icon: burst = Physical, rings = Special, yin-yang = Status. */
export function CategoryIcon({ category }: { category: GenMove['category'] }) {
  return (
    <span
      title={category}
      aria-label={category}
      className="inline-grid h-5 w-8 shrink-0 place-items-center rounded"
      style={{ background: CATEGORY_COLOR[category] }}
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5">
        {category === 'Physical' && (
          <path
            fill="white"
            d="M10 1l2 5.2 5.3-2.4-2.6 5.1 4.3 2.6-5.6.6.8 5.9L10 14l-4.2 4 .8-5.9-5.6-.6 4.3-2.6L2.7 3.8 8 6.2z"
          />
        )}
        {category === 'Special' && (
          <g fill="none" stroke="white" strokeWidth="2">
            <circle cx="10" cy="10" r="7.5" />
            <circle cx="10" cy="10" r="3" />
          </g>
        )}
        {category === 'Status' && (
          <g>
            <circle
              cx="10"
              cy="10"
              r="8"
              fill="none"
              stroke="white"
              strokeWidth="2"
            />
            <path
              fill="white"
              d="M10 2a8 8 0 0 1 0 16a4 4 0 0 1 0-8a4 4 0 0 0 0-8z"
            />
          </g>
        )}
      </svg>
    </span>
  )
}

/** ⓘ with the full move details. */
export function MoveInfo({ move }: { move: GenMove }) {
  return (
    <InfoPopover label={`${move.name} details`}>
      <p className="font-bold">{move.name}</p>
      <div className="mt-1 flex items-center gap-1">
        <TypeBadge type={move.type} />
        <CategoryIcon category={move.category} />
        <span className="text-xs text-slate-400">{move.category}</span>
      </div>
      <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
        {[
          ['Power', move.power ?? '—'],
          ['Accuracy', move.accuracy ?? '—'],
          ['PP', move.pp],
          ['Priority', move.priority > 0 ? `+${move.priority}` : move.priority],
        ].map(([label, value]) => (
          <div key={label} className="rounded bg-slate-800 py-1">
            <dt className="text-slate-400">{label}</dt>
            <dd className="font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-slate-300">{move.desc}</p>
    </InfoPopover>
  )
}

function MoveCard({
  id,
  move,
  option,
  onEdit,
  onRemove,
}: {
  id: string
  move?: GenMove
  option?: PickOption
  onEdit: () => void
  onRemove: () => void
}) {
  const color = TYPE_COLORS[move?.type ?? ''] ?? '#666'
  const illegal = !option || !option.available
  return (
    <div
      className={`relative h-24 rounded-xl border-l-4 p-3 ${illegal ? 'ring-2 ring-red-500' : ''}`}
      style={{
        borderColor: color,
        background: `linear-gradient(90deg, ${color}55, ${color}15)`,
      }}
    >
      {/* the whole card is a button to change the move; the small buttons sit above it */}
      <button
        onClick={onEdit}
        className="absolute inset-0 rounded-xl hover:bg-white/5"
        aria-label={`Change ${move?.name ?? id}`}
      />

      <div className="pointer-events-none relative flex items-center justify-between gap-2">
        <span className="truncate text-base font-bold">{move?.name ?? id}</span>
        {move && (
          <span className="flex shrink-0 items-center gap-1.5">
            <TypeBadge type={move.type} fixed />
            <CategoryIcon category={move.category} />
          </span>
        )}
      </div>

      <div className="pointer-events-none relative mt-2 flex gap-4 text-xs text-slate-200">
        <span>Pow {move?.power ?? '—'}</span>
        <span>Acc {move?.accuracy ?? '—'}</span>
        <span>PP {move?.pp ?? '—'}</span>
      </div>
      {illegal && (
        <p className="pointer-events-none relative mt-1 text-xs text-red-300">
          {option?.reason ?? "Can't be learned in this game"}
        </p>
      )}

      <div className="absolute bottom-2 right-2 flex gap-1">
        {move && <MoveInfo move={move} />}
        <button
          onClick={onRemove}
          className="grid h-6 w-6 place-items-center rounded-full bg-slate-900/70 text-xs text-slate-300 ring-1 ring-slate-700 hover:bg-red-600"
          aria-label={`Remove ${move?.name ?? id}`}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export function MovesSection({
  mon,
  set,
}: {
  mon: Pokemon
  set: (changes: Partial<Pokemon>) => void
}) {
  const mons = useMons()
  const core = useCore()
  const gen = useGameGen(mon.game)
  const game = useGame(mon.game)
  const entry = mons.get(mon.species)
  const speciesName = entry?.name

  // 1) what the learnsets allow  2) + how it was obtained (egg gating, event moves)
  const options = useMemo(() => {
    const base = moveOptions({ mons, game, gen }, mon)
    const eventMoves = selectedEventMoves(
      mon,
      speciesEvents(core.events, mon.species, entry?.baseSpecies),
    )
    return applyObtained(base, {
      game: mon.game,
      level: mon.level,
      obtained: mon.obtained ?? 'caught',
      eventMoves,
      moves: gen.moves,
      speciesName: speciesName ?? mon.species,
    })
  }, [mons, game, gen, mon, core, entry, speciesName])

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options])
  const [editing, setEditing] = useState<number | null>(null)

  function pick(id: string) {
    if (editing === null) return
    const moves = [...mon.moves]
    moves[editing] = id
    set({ moves: moves.filter(Boolean).slice(0, 4) })
    setEditing(null)
  }
  const remove = (i: number) =>
    set({ moves: mon.moves.filter((_, j) => j !== i) })

  return (
    <div className="rounded-2xl bg-slate-800/40 p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Moves
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => {
          const id = mon.moves[i]
          return id ? (
            <MoveCard
              key={i}
              id={id}
              move={gen.moves[id]}
              option={byId.get(id)}
              onEdit={() => setEditing(i)}
              onRemove={() => remove(i)}
            />
          ) : (
            <button
              key={i}
              onClick={() => setEditing(mon.moves.length)} // fills the next free slot
              className="h-24 rounded-xl border border-dashed border-slate-600 text-sm text-slate-500 transition hover:border-red-500 hover:text-red-400"
            >
              + Add move
            </button>
          )
        })}
      </div>

      {editing !== null && (
        <MoveListModal
          options={options}
          chosen={mon.moves}
          speciesName={speciesName}
          onPick={pick}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
