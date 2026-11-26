import { describe, expect, it } from 'vitest'
import { ALL_GAMES } from './games'
import { newPokemon } from './pokemon'
import { toShowdown, type ShowdownCtx } from './showdown'

const gameWith = (version: string) =>
  ALL_GAMES.find((g) => g.versions.includes(version))!.id

const ctx: ShowdownCtx = {
  speciesName: (id) => ({ pikachu: 'Pikachu', mewtwo: 'Mewtwo' })[id] ?? id,
  names: {
    moves: { thunderbolt: 'Thunderbolt', psychic: 'Psychic' },
    items: { lightball: 'Light Ball' },
    abilities: {},
  },
}

describe('toShowdown', () => {
  it('writes a modern set', () => {
    const mon = {
      ...newPokemon('pikachu', gameWith('scarlet')),
      nickname: 'Sparky',
      gender: 'M' as const,
      item: 'lightball',
      ability: 'Static',
      level: 50,
      shiny: false,
      teraType: 'Electric',
      nature: 'Timid',
      evs: [0, 0, 0, 252, 4, 252] as [
        number,
        number,
        number,
        number,
        number,
        number,
      ],
      ivs: [31, 0, 31, 31, 31, 31] as [
        number,
        number,
        number,
        number,
        number,
        number,
      ],
      moves: ['thunderbolt'],
    }
    expect(toShowdown(mon, ctx)).toBe(
      [
        'Sparky (Pikachu) (M) @ Light Ball',
        'Ability: Static',
        'Level: 50',
        'Tera Type: Electric',
        'EVs: 252 SpA / 4 SpD / 252 Spe',
        'Timid Nature',
        'IVs: 0 Atk',
        '- Thunderbolt',
      ].join('\n'),
    )
  })

  it('converts Gen 1 DVs and stat exp to Showdown IVs/EVs', () => {
    const mon = {
      ...newPokemon('mewtwo', gameWith('red')),
      nickname: '',
      gender: '' as const,
      item: '',
      ability: '',
      nature: '',
      teraType: '',
      shiny: false,
      level: 70,
      dvs: [15, 15, 15, 15] as [number, number, number, number],
      statExp: [65535, 65535, 65535, 65535, 65535] as [
        number,
        number,
        number,
        number,
        number,
      ],
      moves: ['psychic'],
    }
    expect(toShowdown(mon, ctx)).toBe(
      [
        'Mewtwo',
        'Level: 70',
        'EVs: 252 HP / 252 Atk / 252 Def / 252 SpA / 252 SpD / 252 Spe',
        '- Psychic',
      ].join('\n'),
    )
  })
})
