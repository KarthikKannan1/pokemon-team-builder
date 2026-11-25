import { GAME_GROUPS, type GameGroup } from '../lib/games'
import { UNIVERSAL } from '../lib/rules'
import { useUi } from '../store/ui'

/** Generation → its dropdown groups, in order. */
const BY_GEN = GAME_GROUPS.reduce((map, group) => {
  map.set(group.gen, [...(map.get(group.gen) ?? []), group])
  return map
}, new Map<number, GameGroup[]>())

export function VersionSelect() {
  const game = useUi((s) => s.game)
  const setGame = useUi((s) => s.setGame)

  // The dropdown shows groups; each group is represented by its first game.
  // (The exact version — Ruby vs Emerald — is chosen per Pokémon in the details panel.)
  const current =
    game === UNIVERSAL
      ? UNIVERSAL
      : (GAME_GROUPS.find((g) => g.games.some((x) => x.id === game))?.games[0]
          .id ?? game)

  return (
    <select
      value={current}
      onChange={(e) => setGame(e.target.value)}
      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
    >
      <option value={UNIVERSAL}>Pokémon HOME (universal)</option>
      {[...BY_GEN].map(([gen, groups]) => (
        <optgroup key={gen} label={`Generation ${gen}`}>
          {groups.map((g) => (
            <option key={g.id} value={g.games[0].id}>
              {g.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
