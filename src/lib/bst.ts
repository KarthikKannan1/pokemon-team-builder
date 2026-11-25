import type { StatTuple } from './types'

/** Base stat total. Gen 1 had one Special stat (stored as both SpA and SpD in our data), so count it once. */
export function baseStatTotal(stats: StatTuple, gen: number): number {
  const [hp, atk, def, spa, spd, spe] = stats
  return hp + atk + def + spa + (gen === 1 ? 0 : spd) + spe
}
