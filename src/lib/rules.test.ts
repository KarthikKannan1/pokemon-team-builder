import { describe, expect, it } from 'vitest'
import { canTransfer, gameFeatures } from './rules'

describe('game features', () => {
  it('Gen 1 has no items, abilities, natures or shiny; uses DVs', () => {
    expect(gameFeatures('red-blue')).toMatchObject({
      heldItem: false,
      ability: false,
      nature: false,
      shiny: false,
      statSystem: 'dv',
      nicknameMax: 10,
    })
  })
  it("Let's Go has natures but no items or abilities; uses AVs", () => {
    expect(gameFeatures('lets-go')).toMatchObject({
      heldItem: false,
      ability: false,
      nature: true,
      statSystem: 'av',
      mega: true,
    })
  })
  it('EV cap is 255 before Gen 6, 252 after', () => {
    expect(gameFeatures('black-white').evPerStatMax).toBe(255)
    expect(gameFeatures('x-y').evPerStatMax).toBe(252)
  })
  it('Tera only in Gen 9; Megas only in their games', () => {
    expect(gameFeatures('scarlet-violet')).toMatchObject({
      tera: true,
      mega: false,
    })
    expect(gameFeatures('platinum').mega).toBe(false)
  })
})

describe('transfers', () => {
  const ok = (a: string, b: string) => canTransfer(a, b).ok
  it('same era both ways', () => {
    expect(ok('ruby-sapphire', 'firered-leafgreen')).toBe(true)
    expect(ok('heartgold-soulsilver', 'platinum')).toBe(true)
    expect(ok('red-blue', 'crystal')).toBe(true) // Time Capsule
    expect(ok('crystal', 'yellow')).toBe(true)
  })
  it('forward along official paths', () => {
    expect(ok('firered-leafgreen', 'x-y')).toBe(true) // Pal Park → Transfer → Transporter
    expect(ok('red-blue', 'sun-moon')).toBe(true) // Virtual Console
    expect(ok('emerald', 'scarlet-violet')).toBe(true)
    expect(ok('lets-go', 'sword-shield')).toBe(true)
  })
  it('never backwards, and no Gen 1–2 → Gen 3–6', () => {
    expect(ok('platinum', 'firered-leafgreen')).toBe(false)
    expect(ok('sun-moon', 'x-y')).toBe(false)
    expect(ok('red-blue', 'x-y')).toBe(false)
    expect(ok('sword-shield', 'lets-go')).toBe(false)
  })
  it('universal mode is a sandbox', () => {
    expect(ok('red-blue', 'home')).toBe(true)
    expect(ok('home', 'red-blue')).toBe(true)
  })
  it('explains backward transfers', () => {
    expect(canTransfer('x-y', 'crystal')).toEqual({
      ok: false,
      reason: "Pokémon can't be sent back from Gen 6 to Gen 2.",
    })
  })
})
