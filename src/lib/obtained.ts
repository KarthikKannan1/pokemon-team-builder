import { ALL_GAMES } from './games'
import {
  GROUP_ORDER,
  type Group,
  type MoveOption,
  type Source,
} from './legality'
import { genOf, UNIVERSAL } from './rules'
import type { EventInfo, GenMove, Obtained, Pokemon } from './types'

export const OBTAINED_LABEL: Record<Obtained, string> = {
  caught: 'Caught (wild)',
  hatched: 'Hatched from egg',
  gift: 'Gift',
  trade: 'In-game trade',
  event: 'Event (Mystery Gift)',
}

/** Gen 1 has no eggs. */
export function obtainedChoices(game: string): Obtained[] {
  const all = Object.keys(OBTAINED_LABEL) as Obtained[]
  return genOf(game) === 1 ? all.filter((o) => o !== 'hatched') : all
}

/** Games where egg moves can be passed on without hatching (Nursery / Mirror Herb), plus universal mode. */
const EGG_MOVES_ANYTIME = new Set([
  UNIVERSAL,
  ...ALL_GAMES.filter((g) =>
    g.versions.some((v) => v === 'sword' || v === 'scarlet'),
  ).map((g) => g.id),
])

/** Gifts are allowed too: some come with egg moves (HGSS Dragon's Den Dratini) and we have no gift data. */
export function eggMovesAllowed(game: string, obtained: Obtained): boolean {
  return (
    EGG_MOVES_ANYTIME.has(game) || obtained === 'hatched' || obtained === 'gift'
  )
}

// ---------------------------------------------------------------- events
export function speciesEvents(
  events: Record<string, EventInfo[]>,
  species: string,
  baseSpecies?: string,
): EventInfo[] {
  return (
    events[species] ?? (baseSpecies ? events[baseSpecies] : undefined) ?? []
  )
}

/** Events up to this game's generation. `index` stays the position in the full list (what we save). */
export function eventChoices(list: EventInfo[], game: string) {
  const gen = genOf(game)
  return list
    .map((event, index) => ({ index, event }))
    .filter(({ event }) => gen === 0 || event.gen <= gen)
}

export function selectedEventMoves(
  mon: Pick<Pokemon, 'obtained' | 'eventIndex'>,
  list: EventInfo[],
): string[] {
  if (mon.obtained !== 'event' || mon.eventIndex === undefined) return []
  return list[mon.eventIndex]?.moves ?? []
}

// ---------------------------------------------------------------- move options + one extra group
export type PickGroup = Group | 'event'
export const PICK_GROUP_ORDER: PickGroup[] = [...GROUP_ORDER, 'event']
export type PickSource = Omit<Source, 'group'> & { group: PickGroup }
export type PickOption = Omit<MoveOption, 'group' | 'sources'> & {
  group: PickGroup
  sources: PickSource[]
}

interface ObtainedCtx {
  game: string
  level: number
  obtained: Obtained
  eventMoves: string[]
  moves: Record<string, GenMove>
  speciesName: string
}

/** Takes moveOptions' result and applies egg gating + event moves. Never mutates the input. */
export function applyObtained(
  options: MoveOption[],
  ctx: ObtainedCtx,
): PickOption[] {
  const eggOk = eggMovesAllowed(ctx.game, ctx.obtained)

  const result: PickOption[] = options.map((o) => {
    if (eggOk || !o.available || !o.sources.some((s) => s.group === 'egg'))
      return o
    // still fine if another way (level-up already reached, TM, tutor) works right now
    const otherWay = o.sources.some((s) => s.group !== 'egg' && s.ok)
    return otherWay
      ? o
      : { ...o, available: false, reason: 'Egg move: only if hatched' }
  })

  const index = new Map(result.map((o, i) => [o.id, i]))
  for (const id of ctx.eventMoves) {
    const source: PickSource = {
      group: 'event',
      via: ctx.speciesName,
      ok: true,
    }
    const i = index.get(id)
    if (i !== undefined) {
      // already in the list (maybe locked) → the event unlocks it
      const { reason: _reason, ...rest } = result[i]
      result[i] = {
        ...rest,
        available: true,
        sources: [...rest.sources, source],
      }
    } else if (ctx.moves[id]) {
      result.push({
        id,
        move: ctx.moves[id],
        group: 'event',
        sources: [source],
        available: true,
      })
    }
  }
  return result
}
