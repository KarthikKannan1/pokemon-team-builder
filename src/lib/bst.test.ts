import { describe, expect, it } from 'vitest'
import { baseStatTotal } from './bst'

describe('baseStatTotal', () => {
  it('Dragonite is 600, but 500 in Gen 1 (one Special stat)', () => {
    expect(baseStatTotal([91, 134, 95, 100, 100, 80], 9)).toBe(600)
    expect(baseStatTotal([91, 134, 95, 100, 100, 80], 1)).toBe(500)
  })
  it('Pikachu is 320', () => {
    expect(baseStatTotal([35, 55, 40, 50, 50, 90], 9)).toBe(320)
  })
})
