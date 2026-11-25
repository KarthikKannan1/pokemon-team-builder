import { describe, expect, it } from 'vitest'
import { ALL_GAMES } from './games'
import type { MoveOption } from './legality'
import {
  applyObtained,
  eggMovesAllowed,
  eventChoices,
  obtainedChoices,
} from './obtained'
import type { GenMove } from './types'

const gameWith = (version: string) =>
  ALL_GAMES.find((g) => g.versions.includes(version))!.id
const HGSS = gameWith('heartgold')
const SV = gameWith('scarlet')

const move = (name: string): GenMove => ({
  name,
  type: 'Normal',
  category: 'Physical',
  power: 80,
  accuracy: 100,
  pp: 5,
  priority: 2,
  desc: '',
})
// test fixture: cast because we only fill the fields this logic reads
const eggOnly = {
  id: 'extremespeed',
  move: move('Extreme Speed'),
  group: 'egg',
  sources: [{ group: 'egg', via: 'Dratini', ok: true }],
  available: true,
} as unknown as MoveOption

const ctx = {
  game: HGSS,
  level: 50,
  eventMoves: [],
  moves: {},
  speciesName: 'Dratini',
}

describe('obtained', () => {
  it('Gen 1 has no "hatched" option', () => {
    expect(obtainedChoices(gameWith('red'))).not.toContain('hatched')
  })

  it('egg moves need hatching, except SwSh/SV and gifts', () => {
    expect(eggMovesAllowed(HGSS, 'caught')).toBe(false)
    expect(eggMovesAllowed(HGSS, 'hatched')).toBe(true)
    expect(eggMovesAllowed(HGSS, 'gift')).toBe(true)
    expect(eggMovesAllowed(SV, 'caught')).toBe(true)
  })

  it('locks egg-only moves for a caught Pokémon', () => {
    const [o] = applyObtained([eggOnly], { ...ctx, obtained: 'caught' })
    expect(o.available).toBe(false)
    const [h] = applyObtained([eggOnly], { ...ctx, obtained: 'hatched' })
    expect(h.available).toBe(true)
  })

  it('event moves are added in their own group', () => {
    const out = applyObtained([], {
      ...ctx,
      obtained: 'event',
      eventMoves: ['fakeout'],
      moves: { fakeout: move('Fake Out') },
    })
    expect(out).toMatchObject([
      { id: 'fakeout', group: 'event', available: true },
    ])
  })

  it('only offers events up to the current generation', () => {
    const list = [
      { gen: 3, level: 10, moves: [] },
      { gen: 5, level: 15, moves: [] },
    ]
    expect(eventChoices(list, gameWith('emerald')).map((c) => c.index)).toEqual(
      [0],
    )
  })
})
