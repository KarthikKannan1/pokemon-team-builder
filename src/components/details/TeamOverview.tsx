import { useLiveQuery } from 'dexie-react-hooks'
import { teamMembers } from '../../db/repo'
import { baseStatTotal } from '../../lib/bst'
import { statGen, useGameGen, useMons } from '../../lib/data'
import { teamCoverage, teamDefense, type TeamMember } from '../../lib/matchups'
import { homeSprite } from '../../lib/sprites'
import { useTypeCharts } from '../../lib/typeChartData'
import type { GenMove } from '../../lib/types'
import { useUi } from '../../store/ui'
import { TypeBadge } from '../TypeBadge'

const card = 'rounded-2xl bg-slate-800/40 p-4'
const heading =
  'mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400'

export function TeamOverview() {
  const teamId = useUi((s) => s.teamId)
  const game = useUi((s) => s.game)
  const team =
    useLiveQuery(() => (teamId ? teamMembers(teamId) : []), [teamId]) ?? []
  const mons = useMons()
  const gen = useGameGen(game)
  const charts = useTypeCharts()
  const g = statGen(game) // universal → 9
  const chart = charts[g]

  if (!team.length) {
    return (
      <p className="text-slate-500">
        Add Pokémon to this team to see how strong it is. Click a Pokémon to
        edit it.
      </p>
    )
  }

  const rows = team.map((mon) => {
    const entry = mons.get(mon.species)
    const species = gen.species[mon.species]
    const member: TeamMember = {
      name: mon.nickname || entry?.name || mon.species,
      types: species?.types ?? [],
      ability: mon.ability,
      moves: mon.moves
        .map((id) => gen.moves[id])
        .filter((m): m is GenMove => !!m),
    }
    return {
      mon,
      entry,
      member,
      total: species ? baseStatTotal(species.stats, g) : 0,
    }
  })
  const members = rows.map((r) => r.member)
  const avg = Math.round(
    rows.reduce((sum, r) => sum + r.total, 0) / rows.length,
  )

  // weak spots: 2+ Pokémon weak and fewer resisting, worst first
  const weakTo = teamDefense(chart, members, g)
    .filter((r) => r.weak >= 2 && r.weak > r.resist)
    .sort((a, b) => b.weak - a.weak)

  const hasAttacks = members.some((m) =>
    m.moves.some((mv) => mv.category !== 'Status' && mv.power),
  )
  const hitsHard = teamCoverage(chart, members).filter((c) => c.hitters > 0)

  return (
    <div className="space-y-6">
      {/* ================================================================ strength */}
      <section className={card}>
        <h4 className={heading}>Team strength</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{avg}</span>
          <span className="text-sm text-slate-400">
            average base stat total (BST)
          </span>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {rows.map((r) => (
            <li
              key={r.mon.uid}
              className="flex items-center gap-2 rounded-lg bg-slate-900/60 p-2"
            >
              <img
                src={homeSprite(r.entry?.pokeapiId ?? 0, r.mon.shiny)}
                alt=""
                className="h-10 w-10 object-contain"
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {r.member.name}
              </span>
              <span className="font-mono text-sm font-bold">{r.total}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ================================================================ weaknesses */}
      <section className={card}>
        <h4 className={heading}>⚠️ Watch out for</h4>
        {weakTo.length ? (
          <ul className="space-y-2">
            {weakTo.map((r) => (
              <li key={r.type} className="flex items-center gap-3 text-sm">
                <TypeBadge type={r.type} fixed />
                <span>
                  {r.weak} of {members.length} are weak
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-green-400">✅ No big weaknesses.</p>
        )}
      </section>

      {/* ================================================================ coverage */}
      <section className={card}>
        <h4 className={heading}>💥 Hits hard</h4>
        {!hasAttacks ? (
          <p className="text-sm text-slate-500">
            Give your Pokémon some attacking moves to see what they hit hard.
          </p>
        ) : hitsHard.length ? (
          <div className="flex flex-wrap gap-2">
            {hitsHard.map((c) => (
              <TypeBadge key={c.type} type={c.type} fixed />
            ))}
          </div>
        ) : (
          <p className="text-sm text-amber-300">
            Your moves aren't super-effective against any type yet.
          </p>
        )}
      </section>
    </div>
  )
}
