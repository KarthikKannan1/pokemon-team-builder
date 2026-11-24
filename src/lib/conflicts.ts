import { ALL_GAMES, GAME_GROUPS } from './games'
import { moveOptions, type LegalityCtx } from './legality'
import { canTransfer, gameFeatures, UNIVERSAL } from './rules'
import { isShinyDVs } from './stats'
import type { Names, Pokemon, StatTuple } from './types'

export interface Fix {
  message: string
  apply: (mon: Pokemon) => Pokemon
}
export interface EntryCheck {
  blockers: string[] // can't be fixed → reject
  fixes: Fix[] // can be fixed → prompt
}
export interface ConflictCtx extends LegalityCtx {
  names: Names
}

export const gameName = (id: string) =>
  id === UNIVERSAL
    ? 'Pokémon HOME'
    : (GAME_GROUPS.find((g) => g.games.some((x) => x.id === id))?.name ?? id)

/** Natures in their official order — Gen 1–2 → Gen 7 transfers pick one by EXP mod 25. */
const NATURES = [
  'Hardy',
  'Lonely',
  'Brave',
  'Adamant',
  'Naughty',
  'Bold',
  'Docile',
  'Relaxed',
  'Impish',
  'Lax',
  'Timid',
  'Hasty',
  'Serious',
  'Jolly',
  'Naive',
  'Modest',
  'Mild',
  'Quiet',
  'Bashful',
  'Rash',
  'Calm',
  'Gentle',
  'Sassy',
  'Careful',
  'Quirky',
]

const genOfGame = (id: string) => ALL_GAMES.find((g) => g.id === id)?.gen ?? 0

/**
 * Poké Transporter rules for Gen 1–2 Virtual Console → Gen 7:
 * 3 random perfect IVs (5 for Mew/Celebi), rest random; EVs reset; Hidden Ability; Poké Ball;
 * shiny if the DVs were shiny. We don't track EXP, so the nature is random too.
 */
export function vcConvert(
  mon: Pokemon,
  hiddenAbility: string,
  rng = Math.random,
): Pokemon {
  const perfect = ['mew', 'celebi'].includes(mon.species) ? 5 : 3
  // Fisher–Yates shuffle: a fair random order of the 6 stats
  const order = [0, 1, 2, 3, 4, 5]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const ivs = [0, 0, 0, 0, 0, 0] as StatTuple
  order.forEach(
    (stat, n) => (ivs[stat] = n < perfect ? 31 : Math.floor(rng() * 32)),
  )
  return {
    ...mon,
    ivs,
    evs: [0, 0, 0, 0, 0, 0],
    nature: NATURES[Math.floor(rng() * 25)],
    ability: hiddenAbility,
    ball: 'pokeball',
    shiny: isShinyDVs(mon.dvs),
    metLocation:
      genOfGame(mon.originGame) === 1 ? 'Kanto (transfer)' : 'Johto (transfer)',
  }
}

export function checkEntry(
  mon: Pokemon,
  target: string,
  ctx?: ConflictCtx,
  rng = Math.random,
): EntryCheck {
  const blockers: string[] = []
  const fixes: Fix[] = []

  const transfer = canTransfer(mon.originGame, target)
  if (!transfer.ok) blockers.push(transfer.reason)
  if (target === UNIVERSAL || !ctx) return { blockers, fixes } // universal = sandbox

  const speciesName = ctx.mons.get(mon.species)?.name ?? mon.species
  if (!ctx.game.learn[mon.species]?.length) {
    blockers.push(`${speciesName} doesn't exist in ${gameName(target)}.`)
  }
  if (blockers.length) return { blockers, fixes }

  const from = gameFeatures(mon.game)
  const to = gameFeatures(target)
  const species = ctx.gen.species[mon.species]
  const abilities = Object.values(species?.abilities ?? {})
  const fromDV = from.statSystem === 'dv'
  const toDV = to.statSystem === 'dv'

  // ---- stat system
  if (fromDV && !toDV) {
    const hidden = species?.abilities.H ?? abilities[0] ?? ''
    fixes.push({
      message:
        'Convert stats with Virtual Console transfer rules (new IVs, EVs reset, Hidden Ability)',
      apply: (m) => vcConvert(m, hidden, rng),
    })
  } else if (!fromDV && toDV) {
    fixes.push({
      message: 'Convert IVs to DVs and reset stat experience',
      apply: (m) => ({
        ...m,
        dvs: [m.ivs[1], m.ivs[2], m.ivs[5], m.ivs[3]].map((v) =>
          Math.floor(v / 2),
        ) as Pokemon['dvs'],
        statExp: [0, 0, 0, 0, 0],
      }),
    })
  }

  // ---- held item
  if (mon.item && (!to.heldItem || !ctx.gen.items[mon.item])) {
    fixes.push({
      message: `Remove held item (${ctx.names.items[mon.item] ?? mon.item})`,
      apply: (m) => ({ ...m, item: '' }),
    })
  }

  // ---- moves
  const opts = new Map(moveOptions(ctx, mon).map((o) => [o.id, o]))
  const badMoves = mon.moves.filter((id) => !opts.get(id)?.available)
  if (badMoves.length) {
    const moveNames = badMoves.map((id) => ctx.names.moves[id] ?? id).join(', ')
    fixes.push({
      message: `Remove ${moveNames}`,
      apply: (m) => ({
        ...m,
        moves: m.moves.filter((id) => !badMoves.includes(id)),
      }),
    })
  }

  // ---- fields the VC conversion doesn't already handle
  if (!(fromDV && !toDV)) {
    if (mon.nature && !to.nature) {
      fixes.push({
        message: 'Remove nature',
        apply: (m) => ({ ...m, nature: '' }),
      })
    }
    if (!mon.nature && to.nature) {
      fixes.push({
        message: 'Set nature to Serious (change it after)',
        apply: (m) => ({ ...m, nature: 'Serious' }),
      })
    }
    if (mon.ability && !to.ability) {
      fixes.push({
        message: 'Remove ability',
        apply: (m) => ({ ...m, ability: '' }),
      })
    }
    if (to.ability && !abilities.includes(mon.ability)) {
      fixes.push({
        message: `Set ability to ${abilities[0]}`,
        apply: (m) => ({ ...m, ability: abilities[0] ?? '' }),
      })
    }
    if (mon.ball && !to.ball) {
      fixes.push({
        message: 'Remove Poké Ball',
        apply: (m) => ({ ...m, ball: '' }),
      })
    }
  }
  if (mon.teraType && !to.tera) {
    fixes.push({
      message: 'Remove Tera type',
      apply: (m) => ({ ...m, teraType: '' }),
    })
  }
  if (mon.gender && !to.gender) {
    fixes.push({
      message: 'Remove gender',
      apply: (m) => ({ ...m, gender: '' }),
    })
  }

  // ---- shininess (Gen 1: none; Gen 2: decided by DVs)
  if (to.gen === 1 && mon.shiny) {
    fixes.push({
      message: 'Gen 1 has no shinies (DVs decide it after transfer)',
      apply: (m) => ({ ...m, shiny: false }),
    })
  }
  if (to.gen === 2) {
    fixes.push({
      message: 'Shininess follows DVs in Gen 2',
      apply: (m) => ({ ...m, shiny: isShinyDVs(m.dvs) }),
    })
  }

  // ---- limits
  if (mon.nickname.length > to.nicknameMax) {
    fixes.push({
      message: `Shorten nickname to ${to.nicknameMax} characters`,
      apply: (m) => ({ ...m, nickname: m.nickname.slice(0, to.nicknameMax) }),
    })
  }
  if (!toDV && mon.evs.some((e) => e > to.evPerStatMax)) {
    fixes.push({
      message: `Cap EVs at ${to.evPerStatMax} per stat`,
      apply: (m) => ({
        ...m,
        evs: m.evs.map((e) => Math.min(e, to.evPerStatMax)) as StatTuple,
      }),
    })
  }

  return { blockers, fixes }
}

/** Run every fix, then move the Pokémon into the target game. */
export function applyFixes(
  mon: Pokemon,
  target: string,
  fixes: Fix[],
): Pokemon {
  const fixed = fixes.reduce((m, fix) => fix.apply(m), mon)
  const version = ALL_GAMES.find((g) => g.id === target)?.versions[0] ?? target
  return { ...fixed, game: target, version }
}
