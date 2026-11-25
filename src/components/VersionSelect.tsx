import { GAME_GROUPS } from '../lib/games'
import { UNIVERSAL } from '../lib/rules'
import { useUi } from '../store/ui'

export function VersionSelect() {
  const game = useUi((s) => s.game)
  const setGame = useUi((s) => s.setGame)

  return (
    <select
      value={game}
      onChange={(e) => setGame(e.target.value)}
      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
    >
      <option value={UNIVERSAL}>Pokémon HOME (universal)</option>
      {GAME_GROUPS.map((group) => (
        <optgroup key={group.id} label={`Gen ${group.gen}`}>
          {group.games.map((g) => (
            <option key={g.id} value={g.id}>
              {group.games.length > 1
                ? `${group.name} — ${g.versions.join(' / ')}`
                : group.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
