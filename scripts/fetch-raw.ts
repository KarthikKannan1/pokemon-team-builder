import { mkdir, writeFile } from 'node:fs/promises'

// PokéAPI's database dump, published as CSV files on GitHub
const BASE =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv'

// The tables we need (one file each)
const FILES = [
  'pokemon', // every Pokémon/form, with its species id
  'pokemon_species', // evolution links (evolves_from_species_id)
  'pokemon_moves', // who learns what, in which game, how, and at what level
  'pokemon_species_flavor_text', // Pokédex entries per game version
  'moves', // move ids → names
  'machines', // which TM/HM/TR teaches which move, per game
  'items', // item ids → names (e.g. "tm25")
  'versions', // red, blue, firered…
  'version_groups', // red-blue, firered-leafgreen… (games that share data)
  'pokedexes', // every regional dex: kanto, kalos-central, melemele…
  'pokedex_version_groups', // which game uses which dex
  'pokemon_dex_numbers', // each species' number in each dex (gives the order)
]

await mkdir('raw', { recursive: true })

for (const name of FILES) {
  const res = await fetch(`${BASE}/${name}.csv`)
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`)
  const text = await res.text()
  await writeFile(`raw/${name}.csv`, text)
  console.log(`✓ ${name}.csv (${(text.length / 1024).toFixed(0)} KB)`)
}
