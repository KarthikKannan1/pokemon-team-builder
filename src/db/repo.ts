import { BOX_SLOTS, TEAM_SIZE, db, type StoredPokemon, type Team } from './db'
import type { Pokemon } from '../lib/types'

export class BoxFullError extends Error {
  constructor() {
    super('The Box is full. Release a Pokémon first.')
  }
}

// ---------------------------------------------------------------- teams
export async function createTeam(game: string, name: string): Promise<Team> {
  const team: Team = {
    id: crypto.randomUUID(),
    game,
    name,
    createdAt: Date.now(),
  }
  await db.teams.add(team)
  return team
}

export const listTeams = (game: string) =>
  db.teams.where('game').equals(game).sortBy('createdAt')

/** Deleting a team releases its Pokémon (the UI warns first). */
export async function deleteTeam(teamId: string) {
  await db.transaction('rw', db.teams, db.pokemon, async () => {
    await db.pokemon.where('teamId').equals(teamId).delete()
    await db.teams.delete(teamId)
  })
}

export const teamMembers = (teamId: string) =>
  db.pokemon.where('teamId').equals(teamId).sortBy('slot')

// ---------------------------------------------------------------- box
export const boxContents = () =>
  db.pokemon.where('place').equals('box').sortBy('slot')

async function firstFreeBoxSlot(): Promise<number> {
  const used = new Set((await boxContents()).map((p) => p.slot))
  for (let slot = 0; slot < BOX_SLOTS; slot++) if (!used.has(slot)) return slot
  throw new BoxFullError()
}

// ---------------------------------------------------------------- creating and releasing
export async function addToBox(mon: Pokemon): Promise<StoredPokemon> {
  return db.transaction('rw', db.pokemon, async () => {
    const stored: StoredPokemon = {
      ...mon,
      place: 'box',
      teamId: null,
      slot: await firstFreeBoxSlot(),
    }
    await db.pokemon.add(stored)
    return stored
  })
}

export async function addToTeam(
  mon: Pokemon,
  teamId: string,
  slot: number,
): Promise<StoredPokemon> {
  if (slot < 0 || slot >= TEAM_SIZE)
    throw new Error(`Team slot must be 0–${TEAM_SIZE - 1}`)
  return db.transaction('rw', db.pokemon, async () => {
    const taken = await db.pokemon
      .where('[teamId+slot]')
      .equals([teamId, slot])
      .first()
    if (taken) throw new Error('That team slot is taken.')
    const stored: StoredPokemon = { ...mon, place: 'team', teamId, slot }
    await db.pokemon.add(stored)
    return stored
  })
}

export const release = (uid: string) => db.pokemon.delete(uid)

export const updatePokemon = (uid: string, changes: Partial<Pokemon>) =>
  db.pokemon.update(uid, changes)

/** PKHeX-style explicit copy: a new Pokémon in the first free Box slot. */
export async function clone(uid: string): Promise<StoredPokemon> {
  const original = await db.pokemon.get(uid)
  if (!original) throw new Error('Pokémon not found')
  const { place: _place, teamId: _teamId, slot: _slot, ...mon } = original
  return addToBox({ ...mon, uid: crypto.randomUUID() })
}

// ---------------------------------------------------------------- moving (swaps if occupied)
export async function moveToTeam(uid: string, teamId: string, slot: number) {
  await db.transaction('rw', db.pokemon, async () => {
    const mon = await db.pokemon.get(uid)
    if (!mon) throw new Error('Pokémon not found')
    const occupant = await db.pokemon
      .where('[teamId+slot]')
      .equals([teamId, slot])
      .first()
    if (occupant && occupant.uid !== uid) {
      // the occupant takes the moving Pokémon's old place
      await db.pokemon.update(occupant.uid, {
        place: mon.place,
        teamId: mon.teamId,
        slot: mon.slot,
      })
    }
    await db.pokemon.update(uid, { place: 'team', teamId, slot })
  })
}

export async function moveToBox(uid: string, slot?: number) {
  await db.transaction('rw', db.pokemon, async () => {
    const mon = await db.pokemon.get(uid)
    if (!mon) throw new Error('Pokémon not found')
    const target = slot ?? (await firstFreeBoxSlot())
    const occupant = await db.pokemon
      .where('[place+slot]')
      .equals(['box', target])
      .first()
    if (occupant && occupant.uid !== uid) {
      await db.pokemon.update(occupant.uid, {
        place: mon.place,
        teamId: mon.teamId,
        slot: mon.slot,
      })
    }
    await db.pokemon.update(uid, { place: 'box', teamId: null, slot: target })
  })
}

// ---------------------------------------------------------------- settings
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  return ((await db.settings.get(key))?.value as T) ?? fallback
}
export const setSetting = (key: string, value: unknown) =>
  db.settings.put({ key, value })
