import { ALL_GAMES } from './games'

export const UNIVERSAL = 'home'

export interface GameFeatures {
  gen: number // 0 = universal
  heldItem: boolean
  ability: boolean
  nature: boolean
  gender: boolean
  shiny: boolean // Gen 1 shows "shiny after transfer" instead
  ball: boolean
  statSystem: 'dv' | 'ev' | 'av' // Gen 1–2 DVs, Let's Go AVs, else IVs/EVs
  evPerStatMax: number
  mega: boolean
  tera: boolean
  nicknameMax: number
}

const MEGA_GAMES = new Set([
  'x-y',
  'omega-ruby-alpha-sapphire',
  'sun-moon',
  'ultra-sun-ultra-moon',
  'lets-go',
])

export function genOf(gameId: string): number {
  if (gameId === UNIVERSAL) return 0
  const game = ALL_GAMES.find((g) => g.id === gameId)
  if (!game) throw new Error(`Unknown game: ${gameId}`)
  return game.gen
}

export function gameFeatures(gameId: string): GameFeatures {
  if (gameId === UNIVERSAL) {
    return {
      gen: 0,
      heldItem: true,
      ability: true,
      nature: true,
      gender: true,
      shiny: true,
      ball: true,
      statSystem: 'ev',
      evPerStatMax: 252,
      mega: true,
      tera: true,
      nicknameMax: 12,
    }
  }
  const gen = genOf(gameId)
  const letsGo = gameId === 'lets-go'
  return {
    gen,
    heldItem: gen >= 2 && !letsGo,
    ability: gen >= 3 && !letsGo,
    nature: gen >= 3,
    gender: gen >= 2,
    shiny: gen >= 2,
    ball: gen >= 3,
    statSystem: gen <= 2 ? 'dv' : letsGo ? 'av' : 'ev',
    evPerStatMax: gen <= 5 ? 255 : 252,
    mega: MEGA_GAMES.has(gameId),
    tera: gen === 9,
    nicknameMax: gen <= 5 ? 10 : 12,
  }
}

// ---------------------------------------------------------------- transfers
type Era =
  | 'gen1'
  | 'gen2'
  | 'gen3'
  | 'gen4'
  | 'gen5'
  | 'gen6'
  | 'gen7'
  | 'lgpe'
  | 'switch'

function eraOf(gameId: string): Era {
  if (gameId === 'lets-go') return 'lgpe'
  const gen = genOf(gameId)
  return gen >= 8 ? 'switch' : (`gen${gen}` as Era)
}

/** Official transfer paths, one step each. Same-era trading is always allowed. */
const NEXT: Record<Era, Era[]> = {
  gen1: ['gen2', 'gen7'], // Time Capsule, Virtual Console → Bank
  gen2: ['gen1', 'gen7'],
  gen3: ['gen4'], // Pal Park
  gen4: ['gen5'], // Poké Transfer
  gen5: ['gen6'], // Poké Transporter
  gen6: ['gen7'], // Poké Bank
  gen7: ['switch'], // Bank → HOME
  lgpe: ['switch'], // → HOME
  switch: [],
}

/** Can a Pokémon from `from` ever end up in `to`? (graph search over eras) */
function reachable(from: Era, to: Era): boolean {
  const seen = new Set<Era>([from])
  const queue: Era[] = [from]
  while (queue.length) {
    const era = queue.shift()!
    if (era === to) return true
    for (const next of NEXT[era]) {
      if (!seen.has(next)) {
        seen.add(next)
        queue.push(next)
      }
    }
  }
  return false
}

export type TransferResult = { ok: true } | { ok: false; reason: string }

export function canTransfer(fromGame: string, toGame: string): TransferResult {
  if (toGame === UNIVERSAL || fromGame === UNIVERSAL) return { ok: true }
  if (reachable(eraOf(fromGame), eraOf(toGame))) return { ok: true }
  const from = ALL_GAMES.find((g) => g.id === fromGame)!
  const to = ALL_GAMES.find((g) => g.id === toGame)!
  return {
    ok: false,
    reason:
      from.gen > to.gen
        ? `Pokémon can't be sent back from Gen ${from.gen} to Gen ${to.gen}.`
        : `There's no way to transfer from ${fromGame} to ${toGame}.`,
  }
}
