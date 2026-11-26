import { TYPE_COLORS } from './typeColors'
import type { GenMove } from './types'

/** defending type → attacking type → multiplier (missing = ×1) */
export type TypeChart = Record<string, Record<string, number>>
/** gen → chart */
export type TypeCharts = Record<number, TypeChart>

/** Types in this chart, in the games' usual order (Normal, Fire, Water…). */
export const typeList = (chart: TypeChart) =>
  Object.keys(TYPE_COLORS).filter((t) => t in chart)

/** Abilities that make a Pokémon immune to a type. */
const ABILITY_IMMUNE: Record<string, string> = {
  Levitate: 'Ground',
  'Earth Eater': 'Ground',
  'Flash Fire': 'Fire',
  'Well-Baked Body': 'Fire',
  'Water Absorb': 'Water',
  'Storm Drain': 'Water',
  'Dry Skin': 'Water',
  'Volt Absorb': 'Electric',
  'Lightning Rod': 'Electric',
  'Motor Drive': 'Electric',
  'Sap Sipper': 'Grass',
}
/** Before Gen 5 these only redirected moves; they didn't give immunity. */
const IMMUNE_FROM_GEN5 = new Set(['Lightning Rod', 'Storm Drain'])
/** Abilities that halve damage from some types. */
const ABILITY_HALVES: Record<string, string[]> = {
  'Thick Fat': ['Fire', 'Ice'],
  Heatproof: ['Fire'],
  'Water Bubble': ['Fire'],
  'Purifying Salt': ['Ghost'],
}

/** How much damage `atk`-type moves do to a Pokémon with these types and ability. */
export function defenseMultiplier(
  chart: TypeChart,
  defTypes: string[],
  atk: string,
  ability = '',
  gen = 9,
): number {
  if (
    ABILITY_IMMUNE[ability] === atk &&
    !(gen < 5 && IMMUNE_FROM_GEN5.has(ability))
  )
    return 0
  let m = defTypes.reduce((acc, t) => acc * (chart[t]?.[atk] ?? 1), 1)
  if (ABILITY_HALVES[ability]?.includes(atk)) m /= 2
  return m
}

// ---------------------------------------------------------------- team
export interface TeamMember {
  name: string
  types: string[]
  ability: string
  moves: GenMove[]
}

export interface DefenseRow {
  type: string
  mults: number[] // one per member
  weak: number
  resist: number // includes immunities
  danger: boolean // 3+ members weak and fewer resisting
}

export function teamDefense(
  chart: TypeChart,
  members: TeamMember[],
  gen: number,
): DefenseRow[] {
  return typeList(chart).map((type) => {
    const mults = members.map((m) =>
      defenseMultiplier(chart, m.types, type, m.ability, gen),
    )
    const weak = mults.filter((x) => x > 1).length
    const resist = mults.filter((x) => x < 1).length
    return { type, mults, weak, resist, danger: weak >= 3 && weak > resist }
  })
}

/** Moves that actually deal type-based damage (skips status moves and fixed-damage moves like Seismic Toss). */
const damaging = (m: GenMove) => m.category !== 'Status' && !!m.power

/** For each type: how many members have a move that hits it super-effectively. */
export function teamCoverage(
  chart: TypeChart,
  members: TeamMember[],
): { type: string; hitters: number }[] {
  return typeList(chart).map((type) => ({
    type,
    hitters: members.filter((m) =>
      m.moves.some((mv) => damaging(mv) && (chart[type]?.[mv.type] ?? 1) > 1),
    ).length,
  }))
}

/** Before Gen 4, a move's type decided physical vs special, not the move itself. */
const SPECIAL_TYPES_PRE_GEN4 = new Set([
  'Fire',
  'Water',
  'Grass',
  'Electric',
  'Ice',
  'Psychic',
  'Dragon',
  'Dark',
])

export function effectiveCategory(
  move: GenMove,
  gen: number,
): GenMove['category'] {
  if (move.category === 'Status' || gen >= 4) return move.category
  return SPECIAL_TYPES_PRE_GEN4.has(move.type) ? 'Special' : 'Physical'
}

export function attackerStyle(
  moves: GenMove[],
  gen: number,
): 'Physical' | 'Special' | 'Mixed' | 'None' {
  const cats = moves.filter(damaging).map((m) => effectiveCategory(m, gen))
  const physical = cats.filter((c) => c === 'Physical').length
  const special = cats.length - physical
  if (!cats.length) return 'None'
  return physical > special
    ? 'Physical'
    : special > physical
      ? 'Special'
      : 'Mixed'
}
