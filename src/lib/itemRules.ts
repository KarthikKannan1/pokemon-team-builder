/** Mega Stones added in Omega Ruby / Alpha Sapphire — not obtainable in X / Y. */
const ORAS_MEGA_STONES = [
  'beedrillite',
  'pidgeotite',
  'slowbronite',
  'steelixite',
  'sceptilite',
  'swampertite',
  'sablenite',
  'sharpedonite',
  'cameruptite',
  'altarianite',
  'glalitite',
  'salamencite',
  'metagrossite',
  'latiasite',
  'latiosite',
  'lopunnite',
  'galladite',
  'audinite',
  'diancite',
]

/**
 * Items that exist in a game's generation but not in that specific game.
 * Our item data is per generation, so this fills the gap. Add entries as you find them.
 */
const NOT_IN_GAME: Record<string, string[]> = {
  'x-y': ORAS_MEGA_STONES,
}

export function allowedItems<T>(
  game: string,
  items: Record<string, T>,
): Record<string, T> {
  const blocked = new Set(NOT_IN_GAME[game] ?? [])
  return Object.fromEntries(
    Object.entries(items).filter(([id]) => !blocked.has(id)),
  )
}
