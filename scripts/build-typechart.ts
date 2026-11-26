import { mkdirSync, writeFileSync } from 'node:fs'
import { Dex } from '@pkmn/dex'

/** Showdown's damageTaken codes → multipliers. 0 = normal (×1), 1 = weak (×2), 2 = resists (×½), 3 = immune (×0) */
const MULT: Record<number, number> = { 1: 2, 2: 0.5, 3: 0 }

/** gen → defending type → attacking type → multiplier (missing = ×1) */
const charts: Record<number, Record<string, Record<string, number>>> = {}

for (let gen = 1; gen <= 9; gen++) {
  // types that exist in this generation (no Dark/Steel in Gen 1, no Fairy before Gen 6)
  const types = Dex.forGen(gen)
    .types.all()
    .filter(
      (t) =>
        t.exists &&
        !t.isNonstandard &&
        t.name !== 'Stellar' &&
        t.name !== '???',
    )
  const names = new Set(types.map((t) => t.name))

  charts[gen] = {}
  for (const def of types) {
    const row: Record<string, number> = {}
    for (const [atk, code] of Object.entries(def.damageTaken)) {
      if (names.has(atk) && code in MULT) row[atk] = MULT[code]
    }
    charts[gen][def.name] = row
  }
  console.log(`  gen ${gen}: ${types.length} types`)
}

mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/typechart.json', JSON.stringify(charts))
console.log('→ public/data/typechart.json')
