import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BOX_SIZE, BOX_SLOTS } from '../db/db'
import { boxContents } from '../db/repo'
import { useMons } from '../lib/data'
import { homeSprite, iconSprite } from '../lib/sprites'
import { useUi } from '../store/ui'
import { Sprite } from './Sprite'

const BOXES = BOX_SLOTS / BOX_SIZE // 32

export function BoxGrid() {
  const { selectedUid, select } = useUi()
  const mons = useMons()
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

      <div className="relative overflow-hidden">
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
            {Array.from({ length: BOX_SIZE }, (_, i) => {
              const mon = bySlot.get(start + i)
              const entry = mon && mons.get(mon.species)
              return (
                <button
                  key={i}
                  disabled={!mon}
                  onClick={() => mon && select(mon.uid)}
                  className={`grid h-16 w-16 place-items-center rounded-lg ${
                    mon?.uid === selectedUid
                      ? 'bg-red-600/30 ring-2 ring-red-500'
                      : mon
                        ? 'bg-slate-800 hover:bg-slate-700'
                        : 'bg-slate-800/40'
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
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
