import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createTeam, listTeams } from '../db/repo'
import { useUi } from '../store/ui'

export function TeamSwitcher() {
  const game = useUi((s) => s.game)
  const teamId = useUi((s) => s.teamId)
  const setTeam = useUi((s) => s.setTeam)

  // Re-runs whenever the teams table changes or `game` changes
  const teams = useLiveQuery(() => listTeams(game), [game])

  // Pick the first team automatically if none (or a stale one) is selected
  useEffect(() => {
    if (!teams) return
    if (!teams.some((t) => t.id === teamId)) setTeam(teams[0]?.id ?? null)
  }, [teams, teamId, setTeam])

  async function addTeam() {
    const team = await createTeam(game, `Team ${(teams?.length ?? 0) + 1}`)
    setTeam(team.id)
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={teamId ?? ''}
        onChange={(e) => setTeam(e.target.value)}
        disabled={!teams?.length}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm disabled:opacity-50"
      >
        {!teams?.length && <option value="">No teams yet</option>}
        {teams?.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        onClick={addTeam}
        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-500"
      >
        + New team
      </button>
    </div>
  )
}
