import {
  BOX_SLOTS,
  db,
  type Setting,
  type StoredPokemon,
  type Team,
} from './db'
import { BoxFullError } from './repo'

const APP = 'pokemon-team-builder'

export interface Backup {
  app: typeof APP
  version: 1
  exportedAt: string
  teams: Team[]
  pokemon: StoredPokemon[]
  settings: Setting[]
}

/** Everything in the database, as one object. */
export async function exportBackup(): Promise<Backup> {
  const [teams, pokemon, settings] = await Promise.all([
    db.teams.toArray(),
    db.pokemon.toArray(),
    db.settings.toArray(),
  ])
  return {
    app: APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    teams,
    pokemon,
    settings,
  }
}

/** A file could contain anything: check it really is our backup before touching the database. */
export function parseBackup(data: unknown): Backup {
  const b = data as Partial<Backup> | null
  if (!b || typeof b !== 'object' || b.app !== APP)
    throw new Error("That file isn't a Pokémon Team Builder backup.")
  if (b.version !== 1)
    throw new Error(`Unsupported backup version: ${String(b.version)}`)
  if (
    !Array.isArray(b.teams) ||
    !Array.isArray(b.pokemon) ||
    !Array.isArray(b.settings)
  ) {
    throw new Error('The backup file is damaged.')
  }
  const okMon = (p: StoredPokemon) =>
    typeof p?.uid === 'string' &&
    typeof p.species === 'string' &&
    (p.place === 'box' || p.place === 'team') &&
    Number.isInteger(p.slot)
  const okTeam = (t: Team) =>
    typeof t?.id === 'string' && typeof t.game === 'string'
  if (!b.pokemon.every(okMon) || !b.teams.every(okTeam))
    throw new Error('The backup file is damaged.')
  return b as Backup
}

/**
 * replace → wipe and load the backup.
 * merge   → keep everything you have; add teams and Pokémon you don't have yet.
 *           Box Pokémon go into free Box slots; team members come along with their (new) team.
 */
export function importBackup(
  backup: Backup,
  mode: 'replace' | 'merge',
): Promise<{ teams: number; pokemon: number }> {
  return db.transaction('rw', db.teams, db.pokemon, db.settings, async () => {
    if (mode === 'replace') {
      await Promise.all([
        db.teams.clear(),
        db.pokemon.clear(),
        db.settings.clear(),
      ])
      await db.teams.bulkAdd(backup.teams)
      await db.pokemon.bulkAdd(backup.pokemon)
      await db.settings.bulkPut(backup.settings)
      return { teams: backup.teams.length, pokemon: backup.pokemon.length }
    }

    const teamIds = new Set((await db.teams.toArray()).map((t) => t.id))
    const uids = new Set((await db.pokemon.toArray()).map((p) => p.uid))
    const newTeams = backup.teams.filter((t) => !teamIds.has(t.id))
    const newTeamIds = new Set(newTeams.map((t) => t.id))

    const usedBox = new Set(
      (await db.pokemon.where('place').equals('box').toArray()).map(
        (p) => p.slot,
      ),
    )
    let next = 0
    const freeBoxSlot = () => {
      while (usedBox.has(next)) next++
      if (next >= BOX_SLOTS) throw new BoxFullError()
      usedBox.add(next)
      return next
    }

    const added: StoredPokemon[] = []
    for (const p of backup.pokemon) {
      if (uids.has(p.uid)) continue // already have it
      if (p.place === 'team' && p.teamId && newTeamIds.has(p.teamId))
        added.push(p)
      else added.push({ ...p, place: 'box', teamId: null, slot: freeBoxSlot() })
    }

    await db.teams.bulkAdd(newTeams)
    await db.pokemon.bulkAdd(added)
    return { teams: newTeams.length, pokemon: added.length }
  })
}
