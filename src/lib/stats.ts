import type { Nature, Pokemon, StatTuple } from './types'

export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const

/** Gen 1–2: the HP DV isn't stored — it's built from the last bit of the other four. */
export function hpDV([atk, def, spe, spc]: Pokemon['dvs']): number {
  return ((atk & 1) << 3) | ((def & 1) << 2) | ((spe & 1) << 1) | (spc & 1)
}

/** Gen 2 shiny rule (also decides Gen 1 → Gen 7 transfer shininess). */
export function isShinyDVs([atk, def, spe, spc]: Pokemon['dvs']): boolean {
  return (
    def === 10 &&
    spe === 10 &&
    spc === 10 &&
    [2, 3, 6, 7, 10, 11, 14, 15].includes(atk)
  )
}

const statExpBonus = (se: number) =>
  Math.floor(Math.min(255, Math.ceil(Math.sqrt(Math.max(0, se)))) / 4)

export function calcStats(
  gen: number,
  base: StatTuple,
  mon: Pokemon,
  natures: Nature[],
): StatTuple {
  const L = mon.level

  if (gen <= 2) {
    const [dAtk, dDef, dSpe, dSpc] = mon.dvs
    const [sHp, sAtk, sDef, sSpe, sSpc] = mon.statExp
    // Special DV and stat exp are shared by SpA and SpD
    const dv = [hpDV(mon.dvs), dAtk, dDef, dSpc, dSpc, dSpe]
    const se = [sHp, sAtk, sDef, sSpc, sSpc, sSpe]
    return base.map((b, i) => {
      const core = Math.floor(
        (((b + dv[i]) * 2 + statExpBonus(se[i])) * L) / 100,
      )
      return i === 0 ? core + L + 10 : core + 5
    }) as StatTuple
  }

  const nature = natures.find((n) => n.name === mon.nature)
  return base.map((b, i) => {
    const core = Math.floor(
      ((2 * b + mon.ivs[i] + Math.floor(mon.evs[i] / 4)) * L) / 100,
    )
    if (i === 0) return b === 1 ? 1 : core + L + 10 // Shedinja always has 1 HP
    let value = core + 5
    if (nature?.plus === STAT_KEYS[i]) value = Math.floor(value * 1.1)
    if (nature?.minus === STAT_KEYS[i]) value = Math.floor(value * 0.9)
    return value
  }) as StatTuple
}
