import { gameFeatures } from './rules'
import type { Names, Pokemon } from './types'

const STAT_NAMES = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe']

export interface ShowdownCtx {
  speciesName: (id: string) => string
  names: Names
}

/** Gen 1–2 stat experience (0–65535) → Showdown's EV scale (0–252). Max stat exp ≈ 252 EVs. */
const statExpToEv = (x: number) => Math.min(252, Math.ceil(Math.sqrt(x)))

/** "252 SpA / 4 SpD" — leaves out the default value (0 for EVs, 31 for IVs). */
function spread(values: number[], skip: number): string {
  return values
    .map((v, i) => (v === skip ? '' : `${v} ${STAT_NAMES[i]}`))
    .filter(Boolean)
    .join(' / ')
}

/** One Pokémon in Showdown's text format (also what PKHeX imports). */
export function toShowdown(mon: Pokemon, ctx: ShowdownCtx): string {
  const species = ctx.speciesName(mon.species)
  const dvSystem = gameFeatures(mon.game).statSystem === 'dv'
  const lines: string[] = []

  let head =
    mon.nickname && mon.nickname !== species
      ? `${mon.nickname} (${species})`
      : species
  if (mon.gender) head += ` (${mon.gender})`
  if (mon.item) head += ` @ ${ctx.names.items[mon.item] ?? mon.item}`
  lines.push(head)

  if (mon.ability) lines.push(`Ability: ${mon.ability}`)
  if (mon.level !== 100) lines.push(`Level: ${mon.level}`)
  if (mon.shiny) lines.push('Shiny: Yes')
  if (mon.teraType) lines.push(`Tera Type: ${mon.teraType}`)

  let evs: number[]
  let ivs: number[]
  if (dvSystem) {
    // statExp = [hp, atk, def, spe, spc]; dvs = [atk, def, spe, spc]; Special counts as SpA and SpD
    const [hp, atk, def, spe, spc] = mon.statExp.map(statExpToEv)
    evs = [hp, atk, def, spc, spc, spe]
    const [a, d, s, c] = mon.dvs.map((v) => v * 2 + 1) // DV 15 → IV 31; Showdown turns it back with ÷2
    ivs = [31, a, d, c, c, s] // HP DV is derived from the others, Showdown recalculates it
  } else {
    evs = mon.evs
    ivs = mon.ivs
  }

  const ev = spread(evs, 0)
  if (ev) lines.push(`EVs: ${ev}`)
  if (mon.nature) lines.push(`${mon.nature} Nature`)
  const iv = spread(ivs, 31)
  if (iv) lines.push(`IVs: ${iv}`)
  for (const m of mon.moves) lines.push(`- ${ctx.names.moves[m] ?? m}`)

  return lines.join('\n')
}

/** Several Pokémon, separated by a blank line (Showdown's team format). */
export const toShowdownTeam = (mons: Pokemon[], ctx: ShowdownCtx) =>
  mons.map((m) => toShowdown(m, ctx)).join('\n\n')
