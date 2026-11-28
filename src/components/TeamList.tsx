import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useLiveQuery } from 'dexie-react-hooks'
import { TEAM_SIZE, type StoredPokemon } from '../db/db'
import { teamMembers } from '../db/repo'
import { useGameGen, useMons } from '../lib/data'
import type { DragData, DropTarget } from '../lib/dnd'
import { activeFormId } from '../lib/forms'
import { itemIcon, monSprites } from '../lib/sprites'
import { useUi } from '../store/ui'
import { Sprite } from './Sprite'
import { TypeBadge } from './TypeBadge'

export function TeamList() {
  const teamId = useUi((s) => s.teamId)
  const members =
    useLiveQuery(() => (teamId ? teamMembers(teamId) : []), [teamId]) ?? []

  if (!teamId) return <p className="text-slate-500">Create a team to start.</p>

  return (
    <ul className="grid grid-cols-2 gap-2">
      {Array.from({ length: TEAM_SIZE }, (_, slot) => (
        <TeamSlot
          key={slot}
          slot={slot}
          mon={members.find((m) => m.slot === slot)}
        />
      ))}
    </ul>
  )
}

/** A team slot: always a drop target; holds a card or the "+ Add" button. */
function TeamSlot({ slot, mon }: { slot: number; mon?: StoredPokemon }) {
  const openPicker = useUi((s) => s.openPicker)
  const target: DropTarget = { kind: 'team', slot }
  const { setNodeRef, isOver } = useDroppable({
    id: `team:${slot}`,
    data: target,
  })

  return (
    <li
      ref={setNodeRef}
      className={`rounded-xl ${isOver ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900' : ''}`}
    >
      {mon ? (
        <TeamCard mon={mon} />
      ) : (
        <button
          onClick={() => openPicker(slot)}
          className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500 transition hover:border-red-500 hover:text-red-400"
        >
          + Add Pokémon
        </button>
      )}
    </li>
  )
}

function TeamCard({ mon }: { mon: StoredPokemon }) {
  const { game, selectedUid, select, openMenu } = useUi()
  const mons = useMons()
  const gen = useGameGen(game)
  const data: DragData = {
    uid: mon.uid,
    species: mon.species,
    shiny: mon.shiny,
  }
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: mon.uid,
    data,
  })

  const entry = mons.get(mon.species)
  const form = mons.get(activeFormId(mon, gen, mons)) ?? entry // Mega if holding its stone
  const types = gen.species[form?.id ?? mon.species]?.types ?? []
  const item = gen.items[mon.item]
  const ball = gen.items[mon.ball]
  const selected = mon.uid === selectedUid

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => select(mon.uid)}
      onContextMenu={(e) => {
        e.preventDefault()
        openMenu(mon.uid, e.clientX, e.clientY)
      }}
      className={`flex h-40 w-full flex-col items-center justify-center gap-1 rounded-xl p-2 transition ${
        isDragging ? 'opacity-30' : ''
      } ${selected ? 'bg-sky-500/20 ring-2 ring-sky-400' : 'bg-slate-800 hover:bg-slate-700'}`}
    >
      <div className="relative h-20 w-20">
        <Sprite
          key={`${form?.id}-${mon.shiny}-${mon.gender}`} // restart the fallback list when these change
          srcs={
            form
              ? monSprites(form, {
                  shiny: mon.shiny,
                  female: mon.gender === 'F',
                })
              : []
          }
          alt=""
          className="h-20 w-20"
        />
        {item?.icon && (
          <img
            src={itemIcon(item.icon)}
            alt={item.name}
            title={item.name}
            className="absolute -bottom-1 -right-2 h-7 w-7 [image-rendering:pixelated]"
          />
        )}
      </div>
      <span className="flex max-w-full items-center gap-1 truncate text-sm font-semibold">
        {ball?.icon && (
          <img
            src={itemIcon(ball.icon)}
            alt={ball.name}
            title={ball.name}
            className="h-5 w-5 shrink-0 [image-rendering:pixelated]"
          />
        )}
        <span className="truncate">{mon.nickname || entry?.name}</span>
        <span className="shrink-0 text-xs font-normal text-slate-400">
          Lv. {mon.level}
        </span>
      </span>
      <span className="flex gap-1">
        {types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </span>
    </button>
  )
}
