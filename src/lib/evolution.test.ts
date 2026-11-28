import { describe, expect, it } from 'vitest'
import { ALL_GAMES } from './games'
import { newPokemon } from './pokemon'
import { evolutionOptions, evolve, type Evolutions } from './evolution'
import type { GenSpecies } from './types'

const SCARLET = ALL_GAMES.find((g) => g.versions.includes('scarlet'))!.id

const evolutions: Evolutions = {
  charmeleon: [{ to: 'charizard', method: 'Lv 36', level: 36 }],
  eevee: [
    { to: 'vaporeon', method: 'Water Stone' },
    { to: 'sylveon', method: 'High friendship' },
  ],
}
const species = (abilities: GenSpecies['abilities']): GenSpecies => ({
  types: [],
  stats: [0, 0, 0, 0, 0, 0],
  abilities,
})

describe('evolution', () => {
  it('only offers evolutions that exist in the game', () => {
    const gen1 = { learn: { vaporeon: [['tackle', 'L', 1]] } } as never // no Sylveon in Gen 1
    expect(
      evolutionOptions('eevee', evolutions, gen1).map((e) => e.to),
    ).toEqual(['vaporeon'])
  })

  it('keeps the ability slot and raises the level if needed', () => {
    const mon = {
      ...newPokemon('charmeleon', SCARLET),
      level: 20,
      ability: 'Solar Power',
      nickname: 'Blaze',
    }
    const out = evolve(
      mon,
      evolutions.charmeleon[0],
      species({ 0: 'Blaze', H: 'Solar Power' }),
      species({ 0: 'Blaze', H: 'Solar Power' }),
    )
    expect(out).toMatchObject({
      species: 'charizard',
      level: 36,
      ability: 'Solar Power',
      nickname: 'Blaze',
    })
  })

  it('keeps a higher level as it is', () => {
    const mon = {
      ...newPokemon('charmeleon', SCARLET),
      level: 50,
      ability: 'Blaze',
    }
    expect(
      evolve(
        mon,
        evolutions.charmeleon[0],
        species({ 0: 'Blaze' }),
        species({ 0: 'Blaze' }),
      ).level,
    ).toBe(50)
  })
})
