import { useEffect, useMemo, useState } from 'react'
import { addToTeam } from '../db/repo'
import { baseStatTotal } from '../lib/bst'
import { dataGen, useGame, useGen, useMonList } from '../lib/data'
import { speciesGen } from '../lib/generation'
import { newPokemon } from '../lib/pokemon'
import { gameFeatures, UNIVERSAL } from '../lib/rules'
import { homeSprite, iconSprite } from '../lib/sprites'
import { TYPE_COLORS } from '../lib/typeColors'
import type { MonEntry } from '../lib/types'
import { useUi } from '../store/ui'
import { Sprite } from './Sprite'
import { TypeBadge } from './TypeBadge'

/** Forms you get in battle from an item, not ones you catch. */
const BATTLE_ONLY = /^(Mega|Gmax|Primal|Eternamax|Totem)/

const control =
  'rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm'

interface Section {
  name: string
  mons: MonEntry[]
}

/** Only mounts the picker when it's open — so its hooks only run then. */
export function PickerModal() {
  const picker = useUi((s) => s.picker)
  const teamId = useUi((s) => s.teamId)
  if (!picker || !teamId) return null
  return <Picker slot={picker.slot} teamId={teamId} />
}

function Picker({ slot, teamId }: { slot: number; teamId: string }) {
  const { game, closePicker, select } = useUi()
  const monList = useMonList()
  const g = dataGen(game) // 0 = universal (newest data)
  const gen = useGen(g)
  // Hooks can't be conditional, so universal mode loads a game file it simply ignores
  const gameData = useGame(game === UNIVERSAL ? 'scarlet-violet' : game)

  const [tab, setTab] = useState(0)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  // filters: 0 / '' = any
  const [genFilter, setGenFilter] = useState(0)
  const [typeFilter, setTypeFilter] = useState('')
  const [sort, setSort] = useState<'dex' | 'bst'>('dex')

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePicker()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closePicker])

  const sections = useMemo<Section[]>(() => {
    const catchable = (m: MonEntry) => !BATTLE_ONLY.test(m.forme ?? '')
    if (game === UNIVERSAL)
      return [{ name: 'All Pokémon', mons: monList.filter(catchable) }]

    // Pokémon (incl. regional forms) that actually have moves in this game
    const inGame = monList.filter(
      (m) => gameData.learn[m.id]?.length && catchable(m),
    )
    const byNum = new Map<number, MonEntry[]>()
    for (const m of inGame) {
      if (!byNum.has(m.num)) byNum.set(m.num, [])
      byNum.get(m.num)!.push(m)
    }

    const listed = new Set<number>()
    const result: Section[] = gameData.sections.map((s) => {
      s.species.forEach((n) => listed.add(n))
      return {
        name: s.name,
        mons: s.species.flatMap((n) => byNum.get(n) ?? []),
      }
    })
    const other = inGame.filter((m) => !listed.has(m.num))
    if (other.length) result.push({ name: 'Other Pokémon', mons: other })
    return result.filter((s) => s.mons.length)
  }, [game, monList, gameData])

  const bst = (m: MonEntry) => {
    const s = gen.species[m.id]
    return s ? baseStatTotal(s.stats, g) : 0
  }

  // Filter choices: only generations and types that actually appear in this game
  const { gens, types } = useMemo(() => {
    const all = sections.flatMap((s) => s.mons)
    const gens = [...new Set(all.map((m) => speciesGen(m.num)))].sort(
      (a, b) => a - b,
    )
    const present = new Set(all.flatMap((m) => gen.species[m.id]?.types ?? []))
    return {
      gens,
      types: Object.keys(TYPE_COLORS).filter((t) => present.has(t)),
    }
  }, [sections, gen])

  // Apply filters to every section (keeps tab positions stable; counts update)
  const filtered = useMemo<Section[]>(() => {
    const matches = (m: MonEntry) =>
      (!genFilter || speciesGen(m.num) === genFilter) &&
      (!typeFilter || (gen.species[m.id]?.types ?? []).includes(typeFilter))
    return sections.map((s) => ({ ...s, mons: s.mons.filter(matches) }))
  }, [sections, genFilter, typeFilter, gen])

  // Searching looks across every section (no duplicates)
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list: MonEntry[]
    if (!q) {
      list = filtered[tab]?.mons ?? []
    } else {
      const seen = new Set<string>()
      list = filtered
        .flatMap((s) => s.mons)
        .filter((m) => {
          if (seen.has(m.id)) return false
          seen.add(m.id)
          return (
            m.name.toLowerCase().includes(q) ||
            String(m.num) === q.replace('#', '')
          )
        })
    }
    if (sort === 'bst') {
      const total = (m: MonEntry) =>
        gen.species[m.id] ? baseStatTotal(gen.species[m.id].stats, g) : 0
      list = [...list].sort((a, b) => total(b) - total(a))
    }
    return list
  }, [filtered, tab, query, sort, gen, g])

  const filtersOn = genFilter !== 0 || typeFilter !== '' || sort !== 'dex'
  const clearFilters = () => {
    setGenFilter(0)
    setTypeFilter('')
    setSort('dex')
  }

  async function pick(entry: MonEntry) {
    const features = gameFeatures(game)
    const abilities = Object.values(gen.species[entry.id]?.abilities ?? {})
    const mon = {
      ...newPokemon(entry.id, game),
      ability: features.ability ? (abilities[0] ?? '') : '',
      nature: features.nature ? 'Serious' : '',
    }
    await addToTeam(mon, teamId, slot)
    closePicker()
    select(mon.uid)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={closePicker}
    >
      <div
        className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // clicks inside don't close it
      >
        {/* header: search, view toggle, close */}
        <div className="flex items-center gap-3 border-b border-slate-800 p-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or #number…"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
          <div className="flex overflow-hidden rounded-lg border border-slate-700 text-sm">
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2 capitalize ${view === v ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={closePicker}
            className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-4 py-2">
          <select
            value={genFilter}
            onChange={(e) => setGenFilter(Number(e.target.value))}
            className={control}
          >
            <option value={0}>All generations</option>
            {gens.map((n) => (
              <option key={n} value={n}>
                Gen {n}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={control}
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'dex' | 'bst')}
            className={control}
          >
            <option value="dex">Sort: Dex order</option>
            <option value="bst">Sort: BST (high → low)</option>
          </select>
          {filtersOn && (
            <button
              onClick={clearFilters}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-slate-500">
            {shown.length} shown
          </span>
        </div>

        {/* section tabs (hidden while searching) */}
        {!query && filtered.length > 1 && (
          <div className="flex gap-1 overflow-x-auto border-b border-slate-800 px-4 py-2">
            {filtered.map((s, i) => (
              <button
                key={s.name}
                onClick={() => setTab(i)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                  tab === i
                    ? 'bg-red-600 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {s.name} <span className="opacity-60">({s.mons.length})</span>
              </button>
            ))}
          </div>
        )}

        {/* results */}
        <div className="flex-1 overflow-y-auto p-4">
          {shown.length === 0 && (
            <p className="text-center text-slate-500">No Pokémon found.</p>
          )}

          {view === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
              {shown.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pick(m)}
                  className="flex flex-col items-center rounded-xl bg-slate-800 p-2 hover:bg-slate-700"
                >
                  <Sprite
                    srcs={[homeSprite(m.pokeapiId)]}
                    alt={m.name}
                    className="h-20 w-20"
                  />
                  <span className="mt-1 w-full truncate text-center text-xs">
                    {m.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    BST {bst(m)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <ul className="space-y-1">
              {shown.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => pick(m)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left hover:bg-slate-800"
                  >
                    <Sprite
                      srcs={[iconSprite(m.pokeapiId), homeSprite(m.pokeapiId)]}
                      alt=""
                      className="h-10 w-10 [image-rendering:pixelated]"
                    />
                    <span className="w-12 text-xs text-slate-500">
                      #{m.num}
                    </span>
                    <span className="flex-1 text-sm">{m.name}</span>
                    <span className="flex gap-1">
                      {(gen.species[m.id]?.types ?? []).map((t) => (
                        <TypeBadge key={t} type={t} fixed />
                      ))}
                    </span>
                    <span className="w-16 text-right font-mono text-xs text-slate-300">
                      {bst(m)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
