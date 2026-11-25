import type { MonEntry } from './types'

const POKEAPI =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites'
const SHOWDOWN = 'https://play.pokemonshowdown.com/sprites'

const toID = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

/** Pokémon HOME 3D render — static, every Pokémon. */
export const homeSprite = (id: number, shiny = false) =>
  `${POKEAPI}/pokemon/other/home/${shiny ? 'shiny/' : ''}${id}.png`

/** Small PC-box icon (up to Gen 8). */
export const iconSprite = (id: number) =>
  `${POKEAPI}/pokemon/versions/generation-viii/icons/${id}.png`

/** Showdown's sprite naming: base species + '-' + forme → 'charizard-megax', 'raichu-alola'. */
const showdownName = (entry: MonEntry) =>
  entry.baseSpecies + (entry.forme ? `-${toID(entry.forme)}` : '')

/** Animated 3D sprite (Showdown) — same style as HOME renders, incl. Megas and forms. */
export const animatedSprite = (entry: MonEntry, shiny = false) =>
  `${SHOWDOWN}/ani${shiny ? '-shiny' : ''}/${showdownName(entry)}.gif`

/** Item / Poké Ball icon. */
export const itemIcon = (icon: string) => `${POKEAPI}/items/${icon}.png`
