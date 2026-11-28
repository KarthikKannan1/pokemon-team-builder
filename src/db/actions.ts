import { TEAM_SIZE, db } from './db'
import { clone, moveToBox, moveToTeam, release } from './repo'
import type { Pokemon } from '../lib/types'

/**
 * Every user action returns this instead of throwing:
 * ok → done · not ok → show the message · 'transfer' → it's from another game, ask the user first.
 */
export type Result =
  | { ok: true }
  | { ok: false; message: string }
  | { ok: 'transfer'; uid: string; slot: number }

const OK: Result = { ok: true }
const fail = (message: string): Result => ({ ok: false, message })

async function attempt(fn: () => Promise<unknown>): Promise<Result> {
  try {
    await fn()
    return OK
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e)) // e.g. "The Box is full…"
  }
}

/** Drop onto a team slot. Swaps with whoever is there (they take the mover's old place). */
export async function dropOnTeam(
  uid: string,
  teamId: string,
  game: string,
  slot: number,
): Promise<Result> {
  const mon = await db.pokemon.get(uid)
  if (!mon) return fail('Pokémon not found.')
  if (mon.place === 'team' && mon.teamId === teamId && mon.slot === slot)
    return OK
  if (mon.game !== game) return { ok: 'transfer', uid, slot }
  return attempt(() => moveToTeam(uid, teamId, slot))
}

/** Drop onto a Box slot. A swap into the team is only allowed if that Pokémon belongs to this game. */
export async function dropOnBox(
  uid: string,
  slot: number,
  game: string,
): Promise<Result> {
  const mon = await db.pokemon.get(uid)
  if (!mon) return fail('Pokémon not found.')
  if (mon.place === 'box' && mon.slot === slot) return OK
  const occupant = await db.pokemon
    .where('[place+slot]')
    .equals(['box', slot])
    .first()
  if (occupant && mon.place === 'team' && occupant.game !== game) {
    return fail(
      "Can't swap: the Pokémon in that slot is from another game. Drop onto an empty slot.",
    )
  }
  return attempt(() => moveToBox(uid, slot))
}

/** Right-click → Move to Box (first free slot). */
export const sendToBox = (uid: string) => attempt(() => moveToBox(uid))

/** Right-click → Add to team (first free team slot). */
export async function sendToTeam(
  uid: string,
  teamId: string,
  game: string,
): Promise<Result> {
  const mon = await db.pokemon.get(uid)
  if (!mon) return fail('Pokémon not found.')
  const used = new Set(
    (await db.pokemon.where('teamId').equals(teamId).toArray()).map(
      (p) => p.slot,
    ),
  )
  const slot = Array.from({ length: TEAM_SIZE }, (_, i) => i).find(
    (i) => !used.has(i),
  )
  if (slot === undefined)
    return fail('The team is full. Move someone to the Box first.')
  if (mon.game !== game) return { ok: 'transfer', uid, slot }
  return attempt(() => moveToTeam(uid, teamId, slot))
}

/** After the user accepts the transfer prompt: save the fixed Pokémon and put it in the team, in one step. */
export function transferToTeam(
  fixed: Pokemon,
  teamId: string,
  slot: number,
): Promise<Result> {
  return attempt(() =>
    db.transaction('rw', db.pokemon, async () => {
      const {
        place: _place,
        teamId: _teamId,
        slot: _slot,
        ...fields
      } = fixed as Pokemon & {
        place?: unknown
        teamId?: unknown
        slot?: unknown
      }
      await db.pokemon.update(fixed.uid, fields)
      await moveToTeam(fixed.uid, teamId, slot)
    }),
  )
}

/** Save changes to one Pokémon (e.g. evolving). */
export const update = (uid: string, changes: Partial<Pokemon>) =>
  attempt(() => db.pokemon.update(uid, changes))

/** Right-click → Clone (PKHeX-style copy into the Box). */
export const copy = (uid: string) => attempt(() => clone(uid))

/** Right-click → Release. Gone for good. */
export const remove = (uid: string) => attempt(() => release(uid))
