import { ALL_GAMES } from './games'
import type { Pokemon } from './types'

export function newPokemon(species: string, game: string): Pokemon {
  const version = ALL_GAMES.find((g) => g.id === game)?.versions[0] ?? game
  return {
    uid: crypto.randomUUID(),
    species,
    nickname: '',
    game,
    version,
    originGame: game,
    level: 50,
    gender: '',
    shiny: false,
    item: '',
    ability: '',
    nature: '',
    ball: '',
    teraType: '',
    moves: [],
    ivs: [31, 31, 31, 31, 31, 31],
    evs: [0, 0, 0, 0, 0, 0],
    dvs: [15, 15, 15, 15],
    statExp: [0, 0, 0, 0, 0],
    metLocation: '',
    metLevel: 0,
    ot: '',
    tid: '',
  }
}
