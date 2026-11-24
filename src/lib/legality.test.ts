/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkMoves, moveOptions, type LegalityCtx } from './legality'
import type { GameData, GenData, MonEntry } from './types'

const load = <T>(path: string): T =>
  JSON.parse(readFileSync(`public/data/${path}.json`, 'utf8'))
const monList = load<MonEntry[]>('pokemon')
const mons = new Map(monList.map((m) => [m.id, m]))
const ctxFor = (game: string, gen: number): LegalityCtx => ({
  mons,
  game: load<GameData>(`games/${game}`),
  gen: load<GenData>(`gens/${gen}`),
})
const find = (ctx: LegalityCtx, species: string, level: number, move: string) =>
  moveOptions(ctx, { species, level }).find((o) => o.id === move)

describe('Red/Blue Pikachu', () => {
  const rb = ctxFor('red-blue', 1)

  it('Lv 5 can still use Thunder via TM25', () => {
    const o = find(rb, 'pikachu', 5, 'thunder')!
    expect(o.available).toBe(true)
    expect(o.group).toBe('tm')
    expect(o.sources.find((s) => s.group === 'tm')?.label).toBe('TM25')
    expect(o.sources.find((s) => s.group === 'level')).toMatchObject({
      level: 43,
      ok: false,
    })
  })

  it('level-up-only moves are greyed out until their level', () => {
    expect(find(rb, 'pikachu', 5, 'agility')).toMatchObject({
      available: false,
      reason: 'Learns at Lv. 33',
    })
    expect(find(rb, 'pikachu', 33, 'agility')?.available).toBe(true)
  })

  it('flags moves the Pokémon is too low-level for', () => {
    const issues = checkMoves(rb, {
      species: 'pikachu',
      level: 5,
      moves: ['thundershock', 'agility'],
    })
    expect(issues).toEqual([
      { level: 'error', message: 'Agility: Learns at Lv. 33.' },
    ])
  })
})

describe('Dragonite + Extreme Speed', () => {
  it('not learnable at all in FireRed/LeafGreen', () => {
    expect(
      find(ctxFor('firered-leafgreen', 3), 'dragonite', 100, 'extremespeed'),
    ).toBeUndefined()
  })
  it('egg move (as Dratini) in HeartGold/SoulSilver', () => {
    const o = find(
      ctxFor('heartgold-soulsilver', 4),
      'dragonite',
      55,
      'extremespeed',
    )!
    expect(o).toMatchObject({ available: true, group: 'egg' })
    expect(o.sources[0].via).toBe('Dratini')
  })
})
