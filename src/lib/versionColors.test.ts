import { describe, expect, it } from 'vitest'
import { ALL_GAMES } from './games'
import { badgeBackground, VERSION_COLORS } from './versionColors'

describe('VERSION_COLORS', () => {
  it('has a colour for every game version', () => {
    const missing = ALL_GAMES.flatMap((g) => g.versions).filter(
      (v) => !VERSION_COLORS[v],
    )
    expect(missing).toEqual([])
  })
})

describe('badgeBackground', () => {
  it('uses a single colour as a plain fill', () => {
    expect(badgeBackground(['#ffd733'])).toBe('#ffd733')
  })

  it('splits paired versions into equal halves', () => {
    expect(badgeBackground(['#025da6', '#ea1a3e'])).toBe(
      'linear-gradient(135deg, #025da6 0% 50%, #ea1a3e 50% 100%)',
    )
  })
})
