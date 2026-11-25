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
  id: string
  name: string
  num: number
  pokeapiId: number
  spriteId: string // Showdown sprite name: 'charizard-megax'
  baseSpecies: string
  forme?: string
  prevo?: string
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
    spriteId: s.spriteid,
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

// ---------------------------------------------------------------- moves: PokéAPI id → Showdown id
const MOVE_FIXES: Record<string, string> = { 'hi-jump-kick': 'highjumpkick' }
const moveIdMap = new Map<string, string>()
for (const m of readCsv('moves')) {
  const move = Dex.moves.get(MOVE_FIXES[m.identifier] ?? m.identifier)
  if (move.exists) moveIdMap.set(m.id, move.id)
}
console.log(`✓ ${moveIdMap.size} moves mapped`)

// ---------------------------------------------------------------- items: TM labels + icon names
const itemRows = readCsv('items')
const itemNames = new Map(itemRows.map((i) => [i.id, i.identifier]))
/** Showdown item id → PokéAPI identifier, used for the item icon URL ("choicescarf" → "choice-scarf") */
const itemIcons = new Map(
  itemRows.map((i) => [toID(i.identifier), i.identifier]),
)

/** version group id → (move id → "TM25") */
const machineLabels = new Map<number, Map<string, string>>()
for (const r of readCsv('machines')) {
  const move = moveIdMap.get(r.move_id)
  const label = itemNames.get(r.item_id)?.toUpperCase() // "tm25" → "TM25"
  if (!move || !label) continue
  const vg = Number(r.version_group_id)
  if (!machineLabels.has(vg)) machineLabels.set(vg, new Map())
  machineLabels.get(vg)!.set(move, label)
}

// ---------------------------------------------------------------- learnsets per game
/** PokéAPI learn method id → our code. 1 level-up, 2 egg, 3 tutor, 4 machine. */
const METHODS: Record<string, string> = {
  '1': 'L',
  '2': 'E',
  '3': 'T',
  '4': 'M',
}
type LearnEntry = [move: string, method: string, level: number]

/** version group id → our game id (DLC groups point at their base game) */
const vgToGame = new Map<number, string>()
for (const game of ALL_GAMES)
  for (const vg of game.versionGroupIds) vgToGame.set(vg, game.id)

/** game id → Pokémon id → (dedupe key → entry) */
const learnsets = new Map<string, Map<string, Map<string, LearnEntry>>>()

for (const r of readCsv('pokemon_moves')) {
  const gameId = vgToGame.get(Number(r.version_group_id))
  const method = METHODS[r.pokemon_move_method_id]
  const mon = pokeapiToId.get(r.pokemon_id)
  const move = moveIdMap.get(r.move_id)
  if (!gameId || !method || !mon || !move) continue // other games, special methods, unmatched

  const level = method === 'L' ? Math.max(1, Number(r.level) || 1) : 0
  if (!learnsets.has(gameId)) learnsets.set(gameId, new Map())
  const byMon = learnsets.get(gameId)!
  if (!byMon.has(mon)) byMon.set(mon, new Map())
  byMon.get(mon)!.set(`${move}|${method}|${level}`, [move, method, level])
}

// ---------------------------------------------------------------- Pokédex sections per game
const dexNames = new Map(readCsv('pokedexes').map((d) => [d.id, d.identifier]))

/** version group id → pokedex ids */
const dexesByVg = new Map<number, string[]>()
for (const r of readCsv('pokedex_version_groups')) {
  const vg = Number(r.version_group_id)
  if (!dexesByVg.has(vg)) dexesByVg.set(vg, [])
  dexesByVg.get(vg)!.push(r.pokedex_id)
}

/** pokedex id → [number in that dex, species id] */
const dexEntries = new Map<string, [number, number][]>()
for (const r of readCsv('pokemon_dex_numbers')) {
  if (!dexEntries.has(r.pokedex_id)) dexEntries.set(r.pokedex_id, [])
  dexEntries
    .get(r.pokedex_id)!
    .push([Number(r.pokedex_number), Number(r.species_id)])
}

/** Games without a National Pokédex (or where the regional one already is it). */
const NO_NATIONAL = new Set([
  'red-blue',
  'yellow',
  'sun-moon',
  'ultra-sun-ultra-moon',
  'lets-go',
  'sword-shield',
  'scarlet-violet',
])

/** "kalos-central" → "Kalos Central" */
const humanize = (id: string) =>
  id
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')

interface DexSection {
  name: string
  species: number[] // National Dex numbers, in this dex's order
}

function dexSectionsFor(game: (typeof ALL_GAMES)[number]): DexSection[] {
  const sections: DexSection[] = []
  const seen = new Set<string>()
  for (const vg of game.versionGroupIds) {
    for (const dexId of dexesByVg.get(vg) ?? []) {
      if (seen.has(dexId)) continue
      seen.add(dexId)
      const entries = [...(dexEntries.get(dexId) ?? [])].sort(
        (a, b) => a[0] - b[0],
      )
      sections.push({
        name: `${humanize(dexNames.get(dexId)!)} Pokédex`,
        species: entries.map((e) => e[1]),
      })
    }
  }
  if (!NO_NATIONAL.has(game.id)) {
    const national = [...speciesById.values()]
      .filter((s) => Number(s.generation_id) <= game.gen)
      .map((s) => Number(s.id))
      .sort((a, b) => a - b)
    sections.push({ name: 'National Pokédex', species: national })
  }
  return sections
}

// ---------------------------------------------------------------- Pokédex entries (English)
const versionNames = new Map(
  readCsv('versions').map((v) => [v.id, v.identifier]),
)
/** version → (species id → text) */
const flavorByVersion = new Map<string, Map<number, string>>()
for (const r of readCsv('pokemon_species_flavor_text')) {
  if (r.language_id !== '9') continue // 9 = English
  const version = versionNames.get(r.version_id)!
  if (!flavorByVersion.has(version)) flavorByVersion.set(version, new Map())
  const text = r.flavor_text
    .replace(/[\f\n\u00ad]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  flavorByVersion.get(version)!.set(Number(r.species_id), text)
}

// ---------------------------------------------------------------- write one file per game
mkdirSync(`${OUT}/games`, { recursive: true })
for (const game of ALL_GAMES) {
  const learn: Record<string, LearnEntry[]> = {}
  for (const [mon, entries] of learnsets.get(game.id) ?? []) {
    learn[mon] = [...entries.values()]
  }

  const tm: Record<string, string> = {}
  for (const vg of game.versionGroupIds) {
    for (const [move, label] of machineLabels.get(vg) ?? []) tm[move] ??= label
  }

  const dex: Record<number, Record<string, string>> = {}
  for (const v of game.versions) {
    for (const [species, text] of flavorByVersion.get(v) ?? []) {
      dex[species] ??= {}
      dex[species][v] = text
    }
  }

  writeJson(`games/${game.id}`, {
    learn,
    tm,
    sections: dexSectionsFor(game),
    dex,
  })
}

// ---------------------------------------------------------------- universal mode: every move from every game
/** Pokémon id → (move|method → entry). Keeps the lowest learn level for level-up moves. */
const universal = new Map<string, Map<string, LearnEntry>>()
for (const byMon of learnsets.values()) {
  for (const [mon, entries] of byMon) {
    if (!universal.has(mon)) universal.set(mon, new Map())
    const merged = universal.get(mon)!
    for (const entry of entries.values()) {
      const [move, method, level] = entry
      const key = `${move}|${method}`
      const existing = merged.get(key)
      if (!existing || level < existing[2]) merged.set(key, entry)
    }
  }
}
writeJson('games/home', {
  learn: Object.fromEntries(
    [...universal].map(([mon, entries]) => [mon, [...entries.values()]]),
  ),
  tm: {},
  sections: [],
  dex: {},
})

// ---------------------------------------------------------------- generation data (Showdown)
/** Only moves that appear in some learnset — keeps files small. */
const usedMoves = new Set<string>()
for (const byMon of learnsets.values())
  for (const entries of byMon.values())
    for (const [move] of entries.values()) usedMoves.add(move)

mkdirSync(`${OUT}/gens`, { recursive: true })
// gen 0 = universal mode: newest data, plus things later games removed (e.g. Mega Stones)
for (let gen = 0; gen <= 9; gen++) {
  const isUniversal = gen === 0
  const g = isUniversal ? 9 : gen
  const D = Dex.forGen(g)

  const species: Record<string, unknown> = {}
  for (const m of mons.values()) {
    const s = D.species.get(m.id)
    if (!s.exists || s.gen > g) continue // didn't exist yet
    const b = s.baseStats
    species[m.id] = {
      types: s.types,
      stats: [b.hp, b.atk, b.def, b.spa, b.spd, b.spe],
      abilities: g >= 3 ? s.abilities : {}, // { 0: 'Blaze', H: 'Solar Power' }
    }
  }

  const moves: Record<string, unknown> = {}
  for (const id of usedMoves) {
    const mv = D.moves.get(id)
    if (!mv.exists || mv.gen > g) continue
    moves[id] = {
      name: mv.name,
      type: mv.type,
      category: mv.category, // Physical / Special / Status
      power: mv.basePower || null,
      accuracy: mv.accuracy === true ? null : mv.accuracy, // true = never misses
      pp: mv.pp,
      priority: mv.priority,
      desc: mv.shortDesc,
    }
  }

  const items: Record<string, unknown> = {}
  if (g >= 2) {
    for (const it of D.items.all()) {
      const allowed =
        !it.isNonstandard || (isUniversal && it.isNonstandard === 'Past')
      if (!it.exists || it.gen > g || !allowed) continue
      items[it.id] = {
        name: it.name,
        desc: it.shortDesc,
        icon: itemIcons.get(it.id), // PokéAPI icon name
        megaStone: it.megaStone, // e.g. { Charizard: 'Charizard-Mega-X' }
        user: it.itemUser, // which Pokémon it's for
        isBall: it.isPokeball || undefined, // for the Poké Ball dropdown
      }
    }
  }

  writeJson(`gens/${gen}`, { species, moves, items })
}

// ---------------------------------------------------------------- core: natures, types, events
const natures = Dex.natures
  .all()
  .map((n) => ({ name: n.name, plus: n.plus ?? null, minus: n.minus ?? null }))
const types = Dex.types
  .all()
  .filter((t) => !t.isNonstandard)
  .map((t) => t.name)

const events: Record<
  string,
  { gen: number; level: number; moves: string[] }[]
> = {}
for (const m of mons.values()) {
  const ls = await Dex.learnsets.get(m.id)
  if (!ls?.eventData?.length) continue
  events[m.id] = ls.eventData.map((e) => ({
    gen: e.generation,
    level: e.level ?? 1,
    moves: (e.moves ?? []).map(toID),
  }))
}

writeJson('core', { natures, types, events })

// ---------------------------------------------------------------- display names + descriptions (all gens)
const names = {
  moves: Object.fromEntries(Dex.moves.all().map((m) => [m.id, m.name])),
  items: Object.fromEntries(Dex.items.all().map((i) => [i.id, i.name])),
  /** ability name → short description (we store abilities by name) */
  abilities: Object.fromEntries(
    Dex.abilities.all().map((a) => [a.name, a.shortDesc]),
  ),
}
writeJson('names', names)
