import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_GAMES } from '../lib/games'
import { newPokemon } from '../lib/pokemon'
import { exportBackup, importBackup, parseBackup } from './backup'
import { db } from './db'
import { addToBox, addToTeam, createTeam } from './repo'

const EMERALD = ALL_GAMES.find((g) => g.versions.includes('emerald'))!.id

beforeEach(async () => {
  await db.pokemon.clear()
  await db.teams.clear()
  await db.settings.clear()
})

describe('backup', () => {
  it('replace: export, wipe, import gives the same data back', async () => {
    const team = await createTeam(EMERALD, 'Main')
    await addToTeam(newPokemon('pikachu', EMERALD), team.id, 0)
    await addToBox(newPokemon('bulbasaur', EMERALD))
    const backup = parseBackup(JSON.parse(JSON.stringify(await exportBackup()))) // like a real file round-trip

    await db.pokemon.clear()
    await db.teams.clear()
    expect(await importBackup(backup, 'replace')).toEqual({
      teams: 1,
      pokemon: 2,
    })
    expect(await db.pokemon.count()).toBe(2)
  })

  it('merge: adds only what is new and finds free Box slots', async () => {
    await addToBox(newPokemon('bulbasaur', EMERALD)) // slot 0
    const backup = await exportBackup()
    const extra = { ...backup.pokemon[0], uid: 'other', slot: 0 } // same slot, different Pokémon
    const result = await importBackup(
      { ...backup, pokemon: [...backup.pokemon, extra] },
      'merge',
    )
    expect(result.pokemon).toBe(1) // the duplicate was skipped
    expect(await db.pokemon.get('other')).toMatchObject({
      place: 'box',
      slot: 1,
    })
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup({ hello: 'world' })).toThrow(
      "isn't a Pokémon Team Builder backup",
    )
    expect(() =>
      parseBackup({
        app: 'pokemon-team-builder',
        version: 1,
        teams: [],
        pokemon: [{}],
        settings: [],
      }),
    ).toThrow('damaged')
  })
})
