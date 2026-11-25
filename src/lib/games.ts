// One entry in the version dropdown = one set of rules (a PokéAPI "version group").
// "versions" are the exact cartridges, recorded per Pokémon.
export interface Game {
  id: string // our key, e.g. 'firered-leafgreen'
  versionGroupIds: number[] // PokéAPI version_group ids (DLC merged in)
  versions: string[] // exact versions, e.g. ['firered', 'leafgreen']
}
export interface GameGroup {
  id: string
  name: string // shown in the dropdown
  gen: number
  games: Game[]
}

/** In release order. */
export const GAME_GROUPS: GameGroup[] = [
  // ---- Gen 1
  {
    id: 'rb',
    name: 'Red / Blue',
    gen: 1,
    games: [
      { id: 'red-blue', versionGroupIds: [1], versions: ['red', 'blue'] },
    ],
  },
  {
    id: 'yellow',
    name: 'Yellow',
    gen: 1,
    games: [{ id: 'yellow', versionGroupIds: [2], versions: ['yellow'] }],
  },
  // ---- Gen 2
  {
    id: 'gs',
    name: 'Gold / Silver',
    gen: 2,
    games: [
      { id: 'gold-silver', versionGroupIds: [3], versions: ['gold', 'silver'] },
    ],
  },
  {
    id: 'crystal',
    name: 'Crystal',
    gen: 2,
    games: [{ id: 'crystal', versionGroupIds: [4], versions: ['crystal'] }],
  },
  // ---- Gen 3
  {
    id: 'rs',
    name: 'Ruby / Sapphire',
    gen: 3,
    games: [
      {
        id: 'ruby-sapphire',
        versionGroupIds: [5],
        versions: ['ruby', 'sapphire'],
      },
    ],
  },
  {
    id: 'frlg',
    name: 'FireRed / LeafGreen',
    gen: 3,
    games: [
      {
        id: 'firered-leafgreen',
        versionGroupIds: [7],
        versions: ['firered', 'leafgreen'],
      },
    ],
  },
  {
    id: 'emerald',
    name: 'Emerald',
    gen: 3,
    games: [{ id: 'emerald', versionGroupIds: [6], versions: ['emerald'] }],
  },
  // ---- Gen 4
  {
    id: 'dp',
    name: 'Diamond / Pearl',
    gen: 4,
    games: [
      {
        id: 'diamond-pearl',
        versionGroupIds: [8],
        versions: ['diamond', 'pearl'],
      },
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    gen: 4,
    games: [{ id: 'platinum', versionGroupIds: [9], versions: ['platinum'] }],
  },
  {
    id: 'hgss',
    name: 'HeartGold / SoulSilver',
    gen: 4,
    games: [
      {
        id: 'heartgold-soulsilver',
        versionGroupIds: [10],
        versions: ['heartgold', 'soulsilver'],
      },
    ],
  },
  // ---- Gen 5
  {
    id: 'bw',
    name: 'Black / White',
    gen: 5,
    games: [
      {
        id: 'black-white',
        versionGroupIds: [11],
        versions: ['black', 'white'],
      },
    ],
  },
  {
    id: 'b2w2',
    name: 'Black 2 / White 2',
    gen: 5,
    games: [
      {
        id: 'black-2-white-2',
        versionGroupIds: [14],
        versions: ['black-2', 'white-2'],
      },
    ],
  },
  // ---- Gen 6
  {
    id: 'xy',
    name: 'X / Y',
    gen: 6,
    games: [{ id: 'x-y', versionGroupIds: [15], versions: ['x', 'y'] }],
  },
  {
    id: 'oras',
    name: 'Omega Ruby / Alpha Sapphire',
    gen: 6,
    games: [
      {
        id: 'omega-ruby-alpha-sapphire',
        versionGroupIds: [16],
        versions: ['omega-ruby', 'alpha-sapphire'],
      },
    ],
  },
  // ---- Gen 7
  {
    id: 'sm',
    name: 'Sun / Moon',
    gen: 7,
    games: [
      { id: 'sun-moon', versionGroupIds: [17], versions: ['sun', 'moon'] },
    ],
  },
  {
    id: 'usum',
    name: 'Ultra Sun / Ultra Moon',
    gen: 7,
    games: [
      {
        id: 'ultra-sun-ultra-moon',
        versionGroupIds: [18],
        versions: ['ultra-sun', 'ultra-moon'],
      },
    ],
  },
  {
    id: 'lgpe',
    name: "Let's Go Pikachu / Eevee",
    gen: 7,
    games: [
      {
        id: 'lets-go',
        versionGroupIds: [19],
        versions: ['lets-go-pikachu', 'lets-go-eevee'],
      },
    ],
  },
  // ---- Gen 8
  {
    id: 'swsh',
    name: 'Sword / Shield',
    gen: 8,
    games: [
      {
        id: 'sword-shield',
        versionGroupIds: [20, 21, 22],
        versions: ['sword', 'shield'],
      },
    ],
  },
  {
    id: 'bdsp',
    name: 'Brilliant Diamond / Shining Pearl',
    gen: 8,
    games: [
      {
        id: 'brilliant-diamond-shining-pearl',
        versionGroupIds: [23],
        versions: ['brilliant-diamond', 'shining-pearl'],
      },
    ],
  },
  // ---- Gen 9
  {
    id: 'sv',
    name: 'Scarlet / Violet',
    gen: 9,
    games: [
      {
        id: 'scarlet-violet',
        versionGroupIds: [25, 26, 27],
        versions: ['scarlet', 'violet'],
      },
    ],
  },
]

/** Every game, flattened, with its gen — handy for lookups. */
export const ALL_GAMES = GAME_GROUPS.flatMap((g) =>
  g.games.map((game) => ({ ...game, gen: g.gen })),
)
