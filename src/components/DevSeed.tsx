import { addToBox, addToTeam, teamMembers } from '../db/repo'
import { useGame, useMonList } from '../lib/data'
import { newPokemon } from '../lib/pokemon'
import { UNIVERSAL } from '../lib/rules'
import { useUi } from '../store/ui'

/** TEMPORARY: adds a random Pokémon from the current game. Removed when the picker (#9) lands. */
export function DevSeed() {
  const { game, teamId } = useUi()
  const list = useMonList()
  const gameData = useGame(game === UNIVERSAL ? 'scarlet-violet' : game)

  async function seed(where: 'team' | 'box') {
    const available = list.filter((m) => gameData.learn[m.id]?.length)
    const pick = available[Math.floor(Math.random() * available.length)]
    const mon = newPokemon(pick.id, game)
    if (where === 'team' && teamId) {
      const used = new Set((await teamMembers(teamId)).map((m) => m.slot))
      const slot = [0, 1, 2, 3, 4, 5].find((s) => !used.has(s))
      if (slot !== undefined) return addToTeam(mon, teamId, slot)
    }
    await addToBox(mon)
  }

  return (
    <div className="flex gap-2 text-xs">
      <button
        onClick={() => seed('team')}
        className="rounded border border-amber-600 px-2 py-1 text-amber-400"
      >
        + test to team
      </button>
      <button
        onClick={() => seed('box')}
        className="rounded border border-amber-600 px-2 py-1 text-amber-400"
      >
        + test to box
      </button>
    </div>
  )
}
