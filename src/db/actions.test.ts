import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_GAMES } from '../lib/games'
import { newPokemon } from '../lib/pokemon'
import { dropOnBox, dropOnTeam, sendToTeam, transferToTeam } from './actions'
import { db } from './db'
import { addToBox, addToTeam, createTeam } from './repo'

const gameWith = (version: string) =>
  ALL_GAMES.find((g) => g.versions.includes(version))!.id
const EMERALD = gameWith('emerald')
const FRLG = gameWith('firered')

beforeEach(async () => {
  await db.pokemon.clear()
  await db.teams.clear()
})

describe('drag & drop actions', () => {
  it('moves a Box Pokémon onto an empty team slot', async () => {
    const team = await createTeam(EMERALD, 'Main')
    const mon = await addToBox(newPokemon('pikachu', EMERALD))
    expect(await dropOnTeam(mon.uid, team.id, EMERALD, 2)).toEqual({ ok: true })
    expect(await db.pokemon.get(mon.uid)).toMatchObject({
      place: 'team',
      teamId: team.id,
      slot: 2,
    })
  })

  it('asks for a transfer when the Pokémon is from another game', async () => {
    const team = await createTeam(EMERALD, 'Main')
    const mon = await addToBox(newPokemon('bulbasaur', FRLG))
    expect(await dropOnTeam(mon.uid, team.id, EMERALD, 0)).toEqual({
      ok: 'transfer',
      uid: mon.uid,
      slot: 0,
    })
    expect(await db.pokemon.get(mon.uid)).toMatchObject({ place: 'box' }) // nothing moved yet
  })

  it('transferToTeam saves the fixed Pokémon into the team', async () => {
    const team = await createTeam(EMERALD, 'Main')
    const mon = await addToBox(newPokemon('bulbasaur', FRLG))
    const result = await transferToTeam(
      { ...mon, game: EMERALD, item: '' },
      team.id,
      0,
    )
    expect(result).toEqual({ ok: true })
    expect(await db.pokemon.get(mon.uid)).toMatchObject({
      place: 'team',
      slot: 0,
      game: EMERALD,
      originGame: FRLG,
    })
  })

  it('only swaps into the team if the Box Pokémon fits this game', async () => {
    const team = await createTeam(EMERALD, 'Main')
    const member = await addToTeam(newPokemon('pikachu', EMERALD), team.id, 0)
    const other = await addToBox(newPokemon('bulbasaur', FRLG))
    expect((await dropOnBox(member.uid, other.slot, EMERALD)).ok).toBe(false)
    expect((await dropOnBox(member.uid, 5, EMERALD)).ok).toBe(true)
    expect(await db.pokemon.get(member.uid)).toMatchObject({
      place: 'box',
      slot: 5,
    })
  })

  it('"Add to team" fails when the team is full', async () => {
    const team = await createTeam(EMERALD, 'Main')
    for (let slot = 0; slot < 6; slot++)
      await addToTeam(newPokemon('pikachu', EMERALD), team.id, slot)
    const extra = await addToBox(newPokemon('pikachu', EMERALD))
    expect(await sendToTeam(extra.uid, team.id, EMERALD)).toMatchObject({
      ok: false,
    })
  })
})
