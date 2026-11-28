import type { GameData, GenSpecies, Pokemon } from './types'

export interface Evolution {
  to: string
  method: string // "Lv 36", "Fire Stone", "Trade"…
  level?: number // only for plain level-up evolutions
}
export type Evolutions = Record<string, Evolution[]>

/** Evolutions that exist in this game (Gen 1 Eevee: 3 options; Scarlet/Violet Eevee: 8). */
export function evolutionOptions(
  species: string,
  evolutions: Evolutions,
  game: Pick<GameData, 'learn'>,
): Evolution[] {
  return (evolutions[species] ?? []).filter((e) => game.learn[e.to]?.length)
}

/**
 * The evolved Pokémon: everything stays (nickname, IVs/EVs, moves, item, ball, OT…), except
 * species, the ability (same slot: Hidden stays Hidden) and the level (raised to the evolution level if lower).
 */
export function evolve(
  mon: Pokemon,
  evo: Evolution,
  from?: GenSpecies,
  to?: GenSpecies,
): Pokemon {
  type Slot = keyof GenSpecies['abilities']
  const slot = Object.entries(from?.abilities ?? {}).find(
    ([, name]) => name === mon.ability,
  )?.[0] as Slot | undefined
  const next = to?.abilities ?? {}
  const ability = mon.ability
    ? (slot && next[slot]) || next['0'] || mon.ability
    : '' // Gen 1–2: no abilities
  return {
    ...mon,
    species: evo.to,
    ability,
    level: Math.max(mon.level, evo.level ?? 0),
  }
}
