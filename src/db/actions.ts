import { TEAM_SIZE, db } from './db'
import { clone, moveToBox, moveToTeam, release } from './repo'

/** Every user action returns this instead of throwing, so the UI can show a message. */
export type Result = { ok: true } | { ok: false; message: string }

const OK: Result = { ok: true }
const fail = (message: string): Result => ({ ok: false, message })
const OTHER_GAME =
  'That Pokémon is from another game. Moving between games comes in the next update.'

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
  if (mon.game !== game) return fail(OTHER_GAME)
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
  if (mon.game !== game) return fail(OTHER_GAME)
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
  return attempt(() => moveToTeam(uid, teamId, slot))
}

/** Right-click → Clone (PKHeX-style copy into the Box). */
export const copy = (uid: string) => attempt(() => clone(uid))

/** Right-click → Release. Gone for good. */
export const remove = (uid: string) => attempt(() => release(uid))
