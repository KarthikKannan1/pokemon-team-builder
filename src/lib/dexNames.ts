/**
 * Pokédex tab names as the games show them, from PokéAPI pokedex identifiers.
 * Used by scripts/build-data.ts.
 *
 * PokéAPI prefixes revised dexes ("original-johto", "updated-alola", "extended-sinnoh",
 * "letsgo-kanto"). Each game only has one of them, so the prefix is dropped: USUM's
 * dex is just the "Alola Pokédex", like in the game.
 */
const PREFIX = /^(original|updated|extended|letsgo)-/

/** Names a word-by-word capitalisation gets wrong. */
const FIXES: Record<string, string> = {
  'kalos-central': 'Central Kalos',
  'kalos-coastal': 'Coastal Kalos',
  'kalos-mountain': 'Mountain Kalos',
  ulaula: 'Ula’ula',
}

/** Small words stay lowercase inside a name ("Isle of Armor"). */
const SMALL = new Set(['of', 'the'])

const titleCase = (id: string) =>
  id
    .split('-')
    .map((w, i) =>
      i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1),
    )
    .join(' ')

/** 'updated-alola' → 'Alola Pokédex', 'isle-of-armor' → 'Isle of Armor Pokédex'. */
export function dexName(identifier: string): string {
  const id = identifier.replace(PREFIX, '')
  return `${FIXES[id] ?? titleCase(id)} Pokédex`
}
