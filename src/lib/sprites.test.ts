import { describe, expect, it } from 'vitest'
import { monSprites } from './sprites'
import type { MonEntry } from './types'

const hippowdon: MonEntry = {
  id: 'hippowdon',
  name: 'Hippowdon',
  num: 450,
  pokeapiId: 450,
  spriteId: '',
  baseSpecies: 'hippowdon',
  genderDiff: true,
}
const garchompMega: MonEntry = {
  id: 'garchompmega',
  name: 'Garchomp-Mega',
  num: 445,
  pokeapiId: 10058,
  spriteId: '',
  baseSpecies: 'garchomp',
  forme: 'Mega',
}

const file = (url: string) => url.replace(/^.*sprites\//, '') // path after the last 'sprites/'

describe('monSprites', () => {
  it('female with a female look: female animated and HOME first, then the defaults', () => {
    expect(
      monSprites(hippowdon, { female: true, animated: true }).map(file),
    ).toEqual([
      'ani/hippowdon-f.gif',
      'pokemon/other/home/female/450.png',
      'ani/hippowdon.gif',
      'pokemon/other/home/450.png',
    ])
  })

  it('shiny female uses the shiny folders', () => {
    expect(
      monSprites(hippowdon, { female: true, shiny: true }).map(file),
    ).toEqual([
      'pokemon/other/home/shiny/female/450.png',
      'pokemon/other/home/shiny/450.png',
    ])
  })

  it('male, or a form without a female look: defaults only', () => {
    expect(monSprites(hippowdon, { animated: true }).map(file)).toEqual([
      'ani/hippowdon.gif',
      'pokemon/other/home/450.png',
    ])
    expect(monSprites(garchompMega, { female: true }).map(file)).toEqual([
      'pokemon/other/home/10058.png',
    ])
  })
})
