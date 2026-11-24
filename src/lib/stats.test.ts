import { describe, expect, it } from 'vitest'
import { calcStats, hpDV, isShinyDVs } from './stats'
import type { Nature, Pokemon } from './types'

const natures: Nature[] = [
  { name: 'Adamant', plus: 'atk', minus: 'spa' },
  { name: 'Serious', plus: null, minus: null },
]

/** A blank Pokémon to tweak per test. */
const mon = (patch: Partial<Pokemon>): Pokemon => ({
  uid: 't',
  species: '',
  nickname: '',
  game: '',
  version: '',
  originGame: '',
  level: 100,
  gender: '',
  shiny: false,
  item: '',
  ability: '',
  nature: 'Serious',
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

describe('Gen 3+ stats', () => {
  it('Garchomp Lv100, 31 IVs, 252 Atk/Spe, Adamant', () => {
    const s = calcStats(
      9,
      [108, 130, 95, 80, 85, 102],
      mon({ nature: 'Adamant', evs: [0, 252, 0, 0, 4, 252] }),
      natures,
    )
    expect(s).toEqual([357, 394, 226, 176, 207, 303])
  })
  it('Shedinja always has 1 HP', () => {
    expect(calcStats(9, [1, 90, 45, 30, 30, 40], mon({}), natures)[0]).toBe(1)
  })
})

describe('Gen 1–2 stats', () => {
  it('Mewtwo Lv100, max DVs and stat exp', () => {
    const s = calcStats(
      1,
      [106, 110, 90, 154, 154, 130],
      mon({ statExp: [65535, 65535, 65535, 65535, 65535] }),
      natures,
    )
    expect(s[0]).toBe(415)
    expect(s[3]).toBe(406)
  })
  it('HP DV comes from the other DVs', () => {
    expect(hpDV([15, 15, 15, 15])).toBe(15)
    expect(hpDV([14, 14, 14, 14])).toBe(0)
  })
  it('Gen 2 shiny rule', () => {
    expect(isShinyDVs([10, 10, 10, 10])).toBe(true)
    expect(isShinyDVs([15, 10, 10, 10])).toBe(true)
    expect(isShinyDVs([9, 10, 10, 10])).toBe(false)
  })
})
