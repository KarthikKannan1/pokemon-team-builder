export type StatTuple = [
  hp: number,
  atk: number,
  def: number,
  spa: number,
  spd: number,
  spe: number,
]

// ---------------------------------------------------------------- data files (public/data)
export interface MonEntry {
  id: string
  name: string
  num: number
  pokeapiId: number
  spriteId: string
  baseSpecies: string
  forme?: string
  prevo?: string
  /** Base form has a different female sprite. */
  genderDiff?: true
}

/** [move id, method, level] — L level-up, M TM/HM/TR, T tutor, E egg */
export type LearnEntry = [
  move: string,
  method: 'L' | 'M' | 'T' | 'E',
  level: number,
]

export interface DexSection {
  name: string
  species: number[]
}

export interface GameData {
  learn: Record<string, LearnEntry[]>
  tm: Record<string, string>
  sections: DexSection[]
  dex: Record<number, Record<string, string>>
}

export interface GenSpecies {
  types: string[]
  stats: StatTuple
  abilities: Partial<Record<'0' | '1' | 'H' | 'S', string>>
}
export interface GenMove {
  name: string
  type: string
  category: 'Physical' | 'Special' | 'Status'
  power: number | null
  accuracy: number | null
  pp: number
  priority: number
  desc: string
}
export interface GenItem {
  name: string
  desc: string
  icon?: string
  megaStone?: Record<string, string>
  user?: string[]
  isBall?: boolean
}
export interface GenData {
  species: Record<string, GenSpecies>
  moves: Record<string, GenMove>
  items: Record<string, GenItem>
}

export interface Nature {
  name: string
  plus: string | null // 'atk', 'def', 'spa', 'spd', 'spe'
  minus: string | null
}
export interface EventInfo {
  gen: number
  level: number
  moves: string[]
}
export interface CoreData {
  natures: Nature[]
  types: string[]
  events: Record<string, EventInfo[]>
}
export interface Names {
  moves: Record<string, string>
  items: Record<string, string>
  /** ability name → short description */
  abilities: Record<string, string>
}

// ---------------------------------------------------------------- a saved Pokémon
/** How it was obtained (PKHeX-style encounter type). */
export type Obtained = 'caught' | 'hatched' | 'gift' | 'trade' | 'event'

export interface Pokemon {
  uid: string
  species: string // MonEntry id
  nickname: string
  game: string // game id, or 'home' for universal
  version: string // exact version, e.g. 'firered'
  originGame: string // where it came from — never changes
  level: number
  gender: '' | 'M' | 'F'
  shiny: boolean
  item: string // item id, '' = none
  ability: string
  nature: string
  ball: string
  teraType: string
  moves: string[] // up to 4 move ids
  /** Gen 3+ */
  ivs: StatTuple
  evs: StatTuple
  /** Gen 1–2: DVs for [atk, def, spe, spc]; stat exp for [hp, atk, def, spe, spc] */
  dvs: [number, number, number, number]
  statExp: [number, number, number, number, number]
  metLocation: string
  metLevel: number
  ot: string
  tid: string
  /** Optional so Pokémon saved before this field existed still load. Missing = 'caught'. */
  obtained?: Obtained
  /** Index into that species' event list, when obtained = 'event' */
  eventIndex?: number
}
