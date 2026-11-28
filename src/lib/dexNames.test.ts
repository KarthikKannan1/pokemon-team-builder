import { describe, expect, it } from 'vitest'
import { dexName } from './dexNames'

describe('dexName', () => {
  it('plain regional dexes', () => {
    expect(dexName('kanto')).toBe('Kanto Pokédex')
    expect(dexName('paldea')).toBe('Paldea Pokédex')
  })

  it('drops the revision prefix (each game has only one version of its dex)', () => {
    expect(dexName('original-johto')).toBe('Johto Pokédex')
    expect(dexName('updated-alola')).toBe('Alola Pokédex')
    expect(dexName('updated-melemele')).toBe('Melemele Pokédex')
    expect(dexName('extended-sinnoh')).toBe('Sinnoh Pokédex')
    expect(dexName('letsgo-kanto')).toBe('Kanto Pokédex')
  })

  it('keeps small words lowercase', () => {
    expect(dexName('isle-of-armor')).toBe('Isle of Armor Pokédex')
    expect(dexName('crown-tundra')).toBe('Crown Tundra Pokédex')
  })

  it('in-game spellings and word order', () => {
    expect(dexName('original-ulaula')).toBe('Ula’ula Pokédex')
    expect(dexName('kalos-central')).toBe('Central Kalos Pokédex')
    expect(dexName('kalos-mountain')).toBe('Mountain Kalos Pokédex')
  })
})
