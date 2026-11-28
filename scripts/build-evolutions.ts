import { mkdirSync, writeFileSync } from 'node:fs'
import { Dex } from '@pkmn/dex'

const toID = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
type Species = ReturnType<typeof Dex.species.get>

/** How the games describe the evolution: "Lv 36", "Fire Stone", "Trade holding Metal Coat"… */
function method(s: Species): { method: string; level?: number } {
  const cond = s.evoCondition ? ` (${s.evoCondition})` : ''
  switch (s.evoType) {
    case 'useItem':
      return { method: `${s.evoItem ?? 'Item'}${cond}` }
    case 'trade':
      return {
        method: s.evoItem ? `Trade holding ${s.evoItem}` : `Trade${cond}`,
      }
    case 'levelFriendship':
      return { method: `High friendship${cond}` }
    case 'levelHold':
      return { method: `Level up holding ${s.evoItem ?? 'an item'}${cond}` }
    case 'levelMove':
      return { method: `Level up knowing ${s.evoMove ?? 'a move'}${cond}` }
    case 'levelExtra':
    case 'other':
      return { method: s.evoCondition ?? 'Special' }
    default:
      return s.evoLevel
        ? { method: `Lv ${s.evoLevel}${cond}`, level: s.evoLevel }
        : { method: `Level up${cond}` }
  }
}

/** species id → what it can evolve into */
const evolutions: Record<
  string,
  { to: string; method: string; level?: number }[]
> = {}
for (const s of Dex.species.all()) {
  if (
    !s.exists ||
    !s.prevo ||
    s.num <= 0 ||
    s.isNonstandard === 'CAP' ||
    s.isNonstandard === 'Custom'
  )
    continue
  ;(evolutions[toID(s.prevo)] ??= []).push({ to: s.id, ...method(s) })
}

mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/evolutions.json', JSON.stringify(evolutions))
console.log(
  `→ public/data/evolutions.json (${Object.keys(evolutions).length} Pokémon can evolve)`,
)
