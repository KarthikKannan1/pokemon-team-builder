import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'csv-parse/sync'
import { Dex } from '@pkmn/dex'
import { ALL_GAMES } from '../src/lib/games'

type Row = Record<string, string>

const OUT = 'public/data'
mkdirSync(OUT, { recursive: true })

function readCsv(name: string): Row[] {
  return parse(readFileSync(`raw/${name}.csv`), {
    columns: true,
    skip_empty_lines: true,
  })
}
function writeJson(name: string, data: unknown) {
  writeFileSync(`${OUT}/${name}.json`, JSON.stringify(data))
  console.log(`→ ${OUT}/${name}.json`)
}
/** Showdown-style id: lowercase letters and digits only ("Mr. Mime" → "mrmime"). */
const toID = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

// ---------------------------------------------------------------- sanity check
const versionGroups = readCsv('version_groups')
const knownIds = new Set(versionGroups.map((v) => Number(v.id)))
for (const game of ALL_GAMES) {
  for (const id of game.versionGroupIds) {
    if (!knownIds.has(id))
      throw new Error(`${game.id}: unknown version group ${id}`)
  }
}
console.log('✓ all version groups exist')

// ---------------------------------------------------------------- Pokémon index
export interface MonEntry {
  id: string // Showdown id, our main key: 'charizardmegax'
  name: string // display name: 'Charizard-Mega-X'
  num: number // National Dex number: 6
  pokeapiId: number // for sprites: 10034
  baseSpecies: string // 'charizard'
  forme?: string // 'Mega-X'
  prevo?: string // pre-evolution id: 'charmeleon'
}

const speciesById = new Map(readCsv('pokemon_species').map((s) => [s.id, s]))
const mons = new Map<string, MonEntry>()
/** PokéAPI pokemon id → our id. Used later to map learnsets. */
const pokeapiToId = new Map<string, string>()
const unmatched: string[] = []

for (const p of readCsv('pokemon')) {
  let s = Dex.species.get(p.identifier)
  // Default forms are often suffixed in PokéAPI ("deoxys-normal") → try the species name
  if (!s.exists && p.is_default === '1')
    s = Dex.species.get(speciesById.get(p.species_id)!.identifier)
  // Cap Pikachus: PokéAPI "pikachu-original-cap" → Showdown "Pikachu-Original"
  if (!s.exists) s = Dex.species.get(p.identifier.replace(/-cap$/, ''))
  if (!s.exists) {
    unmatched.push(p.identifier)
    continue
  }
  pokeapiToId.set(p.id, s.id)
  if (mons.has(s.id) || s.isCosmeticForme) continue // e.g. cosmetic Vivillon patterns
  mons.set(s.id, {
    id: s.id,
    name: s.name,
    num: s.num,
    pokeapiId: Number(p.id),
    baseSpecies: toID(s.baseSpecies),
    forme: s.forme || undefined,
    prevo: s.prevo ? toID(s.prevo) : undefined,
  })
}

console.log(`✓ ${mons.size} Pokémon/forms indexed`)
console.log(
  `  ${unmatched.length} PokéAPI entries had no match, e.g.: ${unmatched.slice(0, 8).join(', ')}`,
)

const monList = [...mons.values()].sort(
  (a, b) => a.num - b.num || a.pokeapiId - b.pokeapiId,
)
writeJson('pokemon', monList)
