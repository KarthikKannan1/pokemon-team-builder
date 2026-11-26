import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useLiveQuery } from 'dexie-react-hooks'
import { BOX_SIZE, BOX_SLOTS, type StoredPokemon } from '../db/db'
import { boxContents } from '../db/repo'
import { useMons } from '../lib/data'
import type { DragData, DropTarget } from '../lib/dnd'
import { homeSprite, iconSprite } from '../lib/sprites'
import { useUi } from '../store/ui'
import { Sprite } from './Sprite'

const BOXES = BOX_SLOTS / BOX_SIZE // 32

export function BoxGrid() {
  const box = useLiveQuery(boxContents) ?? []
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = slide left, -1 = slide right

  function go(to: number) {
    const next = (to + BOXES) % BOXES // wrap around like the games
    setDirection(next > page || (page === BOXES - 1 && next === 0) ? 1 : -1)
    setPage(next)
  }

  const start = page * BOX_SIZE
  const bySlot = new Map(box.map((p) => [p.slot, p]))

  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-3">
        <button
          onClick={() => go(page - 1)}
          className="rounded-lg bg-slate-800 px-3 py-1 hover:bg-slate-700"
        >
          ◀
        </button>
        <select
          value={page}
          onChange={(e) => go(Number(e.target.value))}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-sm"
        >
          {Array.from({ length: BOXES }, (_, i) => (
            <option key={i} value={i}>
              Box {i + 1}
            </option>
          ))}
        </select>
        <button
          onClick={() => go(page + 1)}
          className="rounded-lg bg-slate-800 px-3 py-1 hover:bg-slate-700"
        >
          ▶
        </button>
        <span className="text-xs text-slate-500">
          {box.length}/{BOX_SLOTS}
        </span>
      </div>

      <div className="relative overflow-hidden p-1">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            initial={{ x: `${direction * 100}%`, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: `${direction * -100}%`, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mx-auto grid w-fit grid-cols-6 gap-1.5"
          >
            {Array.from({ length: BOX_SIZE }, (_, i) => (
              <BoxSlot key={i} slot={start + i} mon={bySlot.get(start + i)} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        Drag to move · Right-click for more
      </p>
    </div>
  )
}

/** A Box slot: always a drop target; holds a draggable Pokémon or nothing. */
function BoxSlot({ slot, mon }: { slot: number; mon?: StoredPokemon }) {
  const target: DropTarget = { kind: 'box', slot }
  const { setNodeRef, isOver } = useDroppable({
    id: `box:${slot}`,
    data: target,
  })
  return (
    <div
      ref={setNodeRef}
      className={`h-16 w-16 rounded-lg ${isOver ? 'ring-2 ring-sky-400' : ''}`}
    >
      {mon ? (
        <BoxMon mon={mon} />
      ) : (
        <div className="h-full w-full rounded-lg bg-slate-800/40" />
      )}
    </div>
  )
}

function BoxMon({ mon }: { mon: StoredPokemon }) {
  const { selectedUid, select, openMenu } = useUi()
  const mons = useMons()
  const entry = mons.get(mon.species)
  const data: DragData = {
    uid: mon.uid,
    species: mon.species,
    shiny: mon.shiny,
  }
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: mon.uid,
    data,
  })

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={entry?.name}
      onClick={() => select(mon.uid)}
      onContextMenu={(e) => {
        e.preventDefault()
        openMenu(mon.uid, e.clientX, e.clientY)
      }}
      className={`grid h-full w-full place-items-center rounded-lg ${isDragging ? 'opacity-30' : ''} ${
        mon.uid === selectedUid
          ? 'bg-sky-500/20 ring-2 ring-sky-400'
          : 'bg-slate-800 hover:bg-slate-700'
      }`}
    >
      {entry && (
        <Sprite
          srcs={[
            iconSprite(entry.pokeapiId),
            homeSprite(entry.pokeapiId, mon.shiny),
          ]}
          alt={entry.name}
          className="h-14 w-14 [image-rendering:pixelated]"
        />
      )}
    </button>
  )
}
