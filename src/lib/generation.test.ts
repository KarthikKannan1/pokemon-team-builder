import { describe, expect, it } from 'vitest'
import { speciesGen } from './generation'

describe('speciesGen', () => {
  it('uses the first and last dex number of each generation', () => {
    expect([151, 152, 251, 252, 386, 387].map(speciesGen)).toEqual([
      1, 2, 2, 3, 3, 4,
    ])
    expect([493, 494, 649, 650, 721, 722].map(speciesGen)).toEqual([
      4, 5, 5, 6, 6, 7,
    ])
    expect([809, 810, 905, 906, 1025].map(speciesGen)).toEqual([7, 8, 8, 9, 9])
  })
})
