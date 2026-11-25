import { use, useMemo } from 'react'
import { allowedItems } from './itemRules'
import { genOf } from './rules'
import type { CoreData, GameData, GenData, MonEntry, Names } from './types'

const cache = new Map<string, Promise<unknown>>()

/** Fetch public/data/<path>.json once; later calls get the same promise. */
export function load<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(`${import.meta.env.BASE_URL}data/${path}.json`).then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${path}`)
        return r.json()
      }),
    )
  }
  return cache.get(path) as Promise<T>
}

/** Which gens/<n>.json a game uses. Universal mode = 0 (newest data plus removed items like Mega Stones). */
export const dataGen = (game: string) => genOf(game)

/** Generation number for stat formulas — universal mode uses modern rules. */
export const statGen = (game: string) => genOf(game) || 9

// React 19 `use`: suspends until the promise resolves
export const useMonList = () => use(load<MonEntry[]>('pokemon'))
export const useGen = (gen: number) => use(load<GenData>(`gens/${gen}`))
export const useGame = (game: string) => use(load<GameData>(`games/${game}`))
export const useNames = () => use(load<Names>('names'))
export const useCore = () => use(load<CoreData>('core'))

/** Generation data with items narrowed to what this specific game has. */
export function useGameGen(game: string): GenData {
  const gen = useGen(dataGen(game))
  return useMemo(
    () => ({ ...gen, items: allowedItems(game, gen.items) }),
    [game, gen],
  )
}

export function useMons(): Map<string, MonEntry> {
  const list = useMonList()
  return useMemo(() => new Map(list.map((m) => [m.id, m])), [list])
}
