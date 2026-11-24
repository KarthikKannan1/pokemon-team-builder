import 'fake-indexeddb/auto' // must come first: gives Node a pretend browser database
import { beforeEach, describe, expect, it } from 'vitest'
import { BOX_SLOTS, db } from './db'
import * as repo from './repo'
import type { Pokemon } from '../lib/types'

const mon = (uid: string): Pokemon => ({
  uid,
  species: 'pikachu',
  nickname: uid,
  game: 'red-blue',
  version: 'red',
  originGame: 'red-blue',
  level: 5,
  gender: '',
  shiny: false,
  item: '',
  ability: '',
  nature: '',
  ball: '',
  teraType: '',
  moves: [],
  ivs: [31, 31, 31, 31, 31, 31],
  evs: [0, 0, 0, 0, 0, 0],
  dvs: [15, 15, 15, 15],
  statExp: [0, 0, 0, 0, 0],
  metLocation: '',
  metLevel: 0,
  ot: '',
  tid: '',
})

beforeEach(async () => {
  await db.delete() // fresh database for every test
  await db.open()
})

describe('box', () => {
  it('fills the first free slot', async () => {
    await repo.addToBox(mon('a'))
    await repo.addToBox(mon('b'))
    await repo.release('a')
    const c = await repo.addToBox(mon('c'))
    expect(c.slot).toBe(0) // reuses the gap
  })
  it('refuses when full', async () => {
    await db.pokemon.bulkAdd(
      Array.from({ length: BOX_SLOTS }, (_, i) => ({
        ...mon(`m${i}`),
        place: 'box' as const,
        teamId: null,
        slot: i,
      })),
    )
    await expect(repo.addToBox(mon('extra'))).rejects.toBeInstanceOf(
      repo.BoxFullError,
    )
  })
})

describe('teams', () => {
  it('moves box → team and swaps with the occupant', async () => {
    const team = await repo.createTeam('red-blue', 'Run 1')
    await repo.addToTeam(mon('liz'), team.id, 0)
    const boxed = await repo.addToBox(mon('sparky'))
    await repo.moveToTeam('sparky', team.id, 0)

    expect(await db.pokemon.get('sparky')).toMatchObject({
      place: 'team',
      teamId: team.id,
      slot: 0,
    })
    expect(await db.pokemon.get('liz')).toMatchObject({
      place: 'box',
      teamId: null,
      slot: boxed.slot,
    })
  })
  it('deleting a team releases its Pokémon', async () => {
    const team = await repo.createTeam('red-blue', 'Run 1')
    await repo.addToTeam(mon('liz'), team.id, 0)
    await repo.deleteTeam(team.id)
    expect(await db.pokemon.count()).toBe(0)
  })
  it('lists teams per game', async () => {
    await repo.createTeam('red-blue', 'A')
    await repo.createTeam('x-y', 'B')
    expect((await repo.listTeams('red-blue')).map((t) => t.name)).toEqual(['A'])
  })
})

describe('clone and settings', () => {
  it('clone makes an independent copy in the Box', async () => {
    await repo.addToBox(mon('a'))
    const copy = await repo.clone('a')
    expect(copy.uid).not.toBe('a')
    expect(copy.nickname).toBe('a')
    expect(await db.pokemon.count()).toBe(2)
  })
  it('settings fall back to a default', async () => {
    expect(await repo.getSetting('game', 'home')).toBe('home')
    await repo.setSetting('game', 'x-y')
    expect(await repo.getSetting('game', 'home')).toBe('x-y')
  })
})
