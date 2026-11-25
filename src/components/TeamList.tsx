import { useLiveQuery } from 'dexie-react-hooks'
import { TEAM_SIZE } from '../db/db'
import { teamMembers } from '../db/repo'
import { dataGen, useGen, useMons } from '../lib/data'
import { homeSprite } from '../lib/sprites'
import { useUi } from '../store/ui'
import { Sprite } from './Sprite'
import { TypeBadge } from './TypeBadge'

export function TeamList() {
  const { game, teamId, selectedUid, select, openPicker } = useUi()
  const mons = useMons()
  const gen = useGen(dataGen(game))
  const members =
    useLiveQuery(() => (teamId ? teamMembers(teamId) : []), [teamId]) ?? []

  if (!teamId) return <p className="text-slate-500">Create a team to start.</p>

  return (
    <ul className="space-y-2">
      {Array.from({ length: TEAM_SIZE }, (_, slot) => {
        const mon = members.find((m) => m.slot === slot)
        if (!mon) {
          return (
            <li key={slot}>
              <button
                onClick={() => openPicker(slot)}
                className="flex h-20 w-full items-center rounded-xl border border-dashed border-slate-700 px-4 text-sm text-slate-500 transition hover:border-red-500 hover:text-red-400"
              >
                + Add Pokémon
              </button>
            </li>
          )
        }
        const entry = mons.get(mon.species)
        const types = gen.species[mon.species]?.types ?? []
        const selected = mon.uid === selectedUid
        return (
          <li key={mon.uid}>
            <button
              onClick={() => select(mon.uid)}
              className={`flex h-20 w-full items-center gap-3 rounded-xl px-3 text-left transition ${
                selected
                  ? 'bg-red-600/30 ring-2 ring-red-500'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <Sprite
                srcs={[homeSprite(entry?.pokeapiId ?? 0, mon.shiny)]}
                alt=""
                className="h-16 w-16"
              />
              <span className="flex-1 truncate font-semibold">
                {mon.nickname || entry?.name}
              </span>
              <span className="text-xs text-slate-400">Lv. {mon.level}</span>
              <span className="flex gap-1">
                {types.map((t) => (
                  <TypeBadge key={t} type={t} />
                ))}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
