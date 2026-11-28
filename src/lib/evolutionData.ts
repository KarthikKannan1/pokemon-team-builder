import { use } from 'react'
import type { Evolutions } from './evolution'

let promise: Promise<Evolutions> | undefined

/** Loads public/data/evolutions.json once and suspends until it's ready, like the other data hooks. */
export function useEvolutions(): Evolutions {
  promise ??= fetch(`${import.meta.env.BASE_URL}data/evolutions.json`).then(
    (r) => {
      if (!r.ok) throw new Error(`evolutions.json: ${r.status}`)
      return r.json()
    },
  )
  return use(promise)
}
