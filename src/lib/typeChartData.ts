import { use } from 'react'
import type { TypeCharts } from './matchups'

let promise: Promise<TypeCharts> | undefined

/** Loads public/data/typechart.json once and suspends until it's ready, like the other data hooks. */
export function useTypeCharts(): TypeCharts {
  promise ??= fetch(`${import.meta.env.BASE_URL}data/typechart.json`).then(
    (r) => {
      if (!r.ok) throw new Error(`typechart.json: ${r.status}`)
      return r.json()
    },
  )
  return use(promise)
}
