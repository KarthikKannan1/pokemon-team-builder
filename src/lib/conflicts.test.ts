/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { applyFixes, checkEntry, type ConflictCtx } from './conflicts'
import type { GameData, GenData, MonEntry, Names, Pokemon } from './types'

const load = <T>(p: string): T =>
  JSON.parse(readFileSync(`public/data/${p}.json`, 'utf8'))
const mons = new Map(load<MonEntry[]>('pokemon').map((m) => [m.id, m]))
const names = load<Names>('names')
const ctxFor = (game: string, gen: number): ConflictCtx => ({
  mons,
  names,
  game: load<GameData>(`games/${game}`),
  gen: load<GenData>(`gens/${gen}`),
})

const mon = (patch: Partial<Pokemon>): Pokemon => ({
  uid: 't',
  species: 'pikachu',
  nickname: '',
  game: 'home',
  version: '',
  originGame: 'home',
  level: 50,
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
  ...patch,
})
const messages = (c: { fixes: { message: string }[] }) =>
  c.fixes.map((f) => f.message)

describe('blockers', () => {
  it('rejects backward transfers', () => {
    const c = checkEntry(
      mon({ originGame: 'x-y', game: 'x-y' }),
      'crystal',
      ctxFor('crystal', 2),
    )
    expect(c.blockers).toEqual([
      "Pokémon can't be sent back from Gen 6 to Gen 2.",
    ])
  })
  it("rejects species that don't exist in the game", () => {
    const c = checkEntry(
      mon({ species: 'togekiss' }),
      'red-blue',
      ctxFor('red-blue', 1),
    )
    expect(c.blockers).toEqual(["Togekiss doesn't exist in Red / Blue."])
  })
})

describe('Liz goes back into Red', () => {
  const liz = mon({
    species: 'charizard',
    nickname: 'Liz',
    originGame: 'red-blue',
    game: 'home',
    level: 60,
    item: 'leftovers',
    nature: 'Adamant',
    ability: 'Blaze',
    moves: ['flamethrower', 'dragonclaw'],
  })
  const c = checkEntry(liz, 'red-blue', ctxFor('red-blue', 1))

  it('lists every conflict', () => {
    expect(c.blockers).toEqual([])
    expect(messages(c)).toEqual([
      'Convert IVs to DVs and reset stat experience',
      'Remove held item (Leftovers)',
      'Remove Dragon Claw',
      'Remove nature',
      'Remove ability',
    ])
  })
  it('applies the fixes', () => {
    const fixed = applyFixes(liz, 'red-blue', c.fixes)
    expect(fixed).toMatchObject({
      game: 'red-blue',
      version: 'red',
      item: '',
      nature: '',
      ability: '',
      moves: ['flamethrower'],
      dvs: [15, 15, 15, 15],
    })
  })
})

describe('Virtual Console transfer (Red → Sun/Moon)', () => {
  const red = mon({
    originGame: 'red-blue',
    game: 'red-blue',
    moves: ['thundershock'],
  })
  const c = checkEntry(red, 'sun-moon', ctxFor('sun-moon', 7), () => 0) // fake rng
  const fixed = applyFixes(red, 'sun-moon', c.fixes)

  it('re-rolls IVs with exactly 3 perfect, resets EVs', () => {
    expect(fixed.ivs.filter((iv) => iv === 31)).toHaveLength(3)
    expect(fixed.evs).toEqual([0, 0, 0, 0, 0, 0])
  })
  it('gives the Hidden Ability and a Poké Ball', () => {
    expect(fixed).toMatchObject({
      ability: 'Lightning Rod',
      ball: 'pokeball',
      metLocation: 'Kanto (transfer)',
    })
  })
})
