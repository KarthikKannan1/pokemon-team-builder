import { use, useMemo } from 'react'
import { genOf } from './rules'
import type { GameData, GenData, MonEntry, Names } from './types'

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

/** Universal mode uses the newest generation's data. */
export const dataGen = (game: string) => genOf(game) || 9

// React 19 `use`: suspends until the promise resolves
export const useMonList = () => use(load<MonEntry[]>('pokemon'))
export const useGen = (gen: number) => use(load<GenData>(`gens/${gen}`))
export const useGame = (game: string) => use(load<GameData>(`games/${game}`))
export const useNames = () => use(load<Names>('names'))

export function useMons(): Map<string, MonEntry> {
  const list = useMonList()
  return useMemo(() => new Map(list.map((m) => [m.id, m])), [list])
}
