import Dexie, { type EntityTable } from 'dexie'
import type { Pokemon } from '../lib/types'

export const BOX_SLOTS = 960 // 32 boxes × 30, like Scarlet/Violet
export const BOX_SIZE = 30
export const TEAM_SIZE = 6

export interface Team {
  id: string
  game: string // game id, or 'home'
  name: string
  createdAt: number
}

/** A Pokémon plus where it is. Exactly one place at a time. */
export type StoredPokemon = Pokemon & {
  place: 'box' | 'team'
  teamId: string | null // set when place = 'team'
  slot: number // 0–959 in the Box, 0–5 in a team
}

export interface Setting {
  key: string
  value: unknown
}

export const db = new Dexie('pokemon-team-builder') as Dexie & {
  pokemon: EntityTable<StoredPokemon, 'uid'>
  teams: EntityTable<Team, 'id'>
  settings: EntityTable<Setting, 'key'>
}

// Indexes: fields we search by. [a+b] = compound index for "this team, this slot" lookups.
db.version(1).stores({
  pokemon: 'uid, place, teamId, [place+slot], [teamId+slot]',
  teams: 'id, game',
  settings: 'key',
})
