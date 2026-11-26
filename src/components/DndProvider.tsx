import { useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { dropOnBox, dropOnTeam } from '../db/actions'
import { useMons } from '../lib/data'
import type { DragData, DropTarget } from '../lib/dnd'
import { homeSprite, iconSprite } from '../lib/sprites'
import { report } from '../store/report'
import { useUi } from '../store/ui'
import { Sprite } from './Sprite'

export function DndProvider({ children }: { children: ReactNode }) {
  const teamId = useUi((s) => s.teamId)
  const game = useUi((s) => s.game)
  const mons = useMons()
  const [dragging, setDragging] = useState<DragData | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), // small moves are still clicks
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }), // long-press on phones
  )

  async function onDragEnd(e: DragEndEvent) {
    setDragging(null)
    const target = e.over?.data.current as DropTarget | undefined
    if (!target) return // dropped outside any slot
    const uid = String(e.active.id)
    if (target.kind === 'team') {
      report(
        teamId
          ? await dropOnTeam(uid, teamId, game, target.slot)
          : { ok: false, message: 'Create a team first.' },
      )
    } else {
      report(await dropOnBox(uid, target.slot, game))
    }
  }

  const entry = dragging ? mons.get(dragging.species) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin} // the slot under the mouse is the target
      onDragStart={(e: DragStartEvent) =>
        setDragging(e.active.data.current as DragData)
      }
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {children}
      {/* the icon that follows the cursor; the overlay box is the size of the dragged card, so centre it */}
      <DragOverlay dropAnimation={null}>
        {entry && (
          <div className="grid h-full w-full place-items-center">
            <Sprite
              srcs={[
                iconSprite(entry.pokeapiId),
                homeSprite(entry.pokeapiId, dragging?.shiny ?? false),
              ]}
              alt={entry.name}
              className="h-16 w-16 drop-shadow-lg [image-rendering:pixelated]"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
