import type { MonEntry } from './types'

const POKEAPI =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites'
const SHOWDOWN = 'https://play.pokemonshowdown.com/sprites'

const toID = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

/** Pokémon HOME 3D render — static, every Pokémon. */
export const homeSprite = (id: number, shiny = false, female = false) =>
  `${POKEAPI}/pokemon/other/home/${shiny ? 'shiny/' : ''}${female ? 'female/' : ''}${id}.png`

/** Small PC-box icon (up to Gen 8). */
export const iconSprite = (id: number) =>
  `${POKEAPI}/pokemon/versions/generation-viii/icons/${id}.png`

/** Showdown's sprite naming: base species + '-' + forme → 'charizard-megax', 'raichu-alola'. */
const showdownName = (entry: MonEntry) =>
  entry.baseSpecies + (entry.forme ? `-${toID(entry.forme)}` : '')

/** Animated 3D sprite (Showdown) — same style as HOME renders, incl. Megas and forms. */
export const animatedSprite = (
  entry: MonEntry,
  shiny = false,
  female = false,
) =>
  `${SHOWDOWN}/ani${shiny ? '-shiny' : ''}/${showdownName(entry)}${female ? '-f' : ''}.gif`

/**
 * URLs to try in order for a Pokémon's sprite (for <Sprite srcs>).
 * Female, and the form has a female look → the female sprites first, then the default ones.
 * Showdown only has an animated female GIF for some species, so a static HOME female render
 * can win over the animated default.
 */
export function monSprites(
  entry: MonEntry,
  {
    shiny = false,
    female = false,
    animated = false,
  }: { shiny?: boolean; female?: boolean; animated?: boolean } = {},
): string[] {
  const urls = (f: boolean) =>
    animated
      ? [animatedSprite(entry, shiny, f), homeSprite(entry.pokeapiId, shiny, f)]
      : [homeSprite(entry.pokeapiId, shiny, f)]
  return female && entry.genderDiff
    ? [...urls(true), ...urls(false)]
    : urls(false)
}

/** Item / Poké Ball icon. */
export const itemIcon = (icon: string) => `${POKEAPI}/items/${icon}.png`
