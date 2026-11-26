import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { copy, remove, sendToBox, sendToTeam, type Result } from '../db/actions'
import { db, type StoredPokemon } from '../db/db'
import { useMons } from '../lib/data'
import { report } from '../store/report'
import { useUi } from '../store/ui'

const WIDTH = 208 // w-52

/** Right-click menu for a Pokémon. */
export function ContextMenu() {
  const menu = useUi((s) => s.menu)
  const closeMenu = useUi((s) => s.closeMenu)
  const mon = useLiveQuery(
    () => (menu ? db.pokemon.get(menu.uid) : undefined),
    [menu?.uid],
  )

  // close on Escape, scroll or resize
  useEffect(() => {
    if (!menu) return
    const close = () => closeMenu()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu, closeMenu])

  if (!menu || !mon) return null
  // key → a new menu starts fresh (no leftover "click again to release")
  return (
    <MenuBody
      key={`${menu.uid}-${menu.x}-${menu.y}`}
      mon={mon}
      x={menu.x}
      y={menu.y}
    />
  )
}

function MenuBody({ mon, x, y }: { mon: StoredPokemon; x: number; y: number }) {
  const { teamId, game, selectedUid, closeMenu } = useUi()
  const mons = useMons()
  const [confirming, setConfirming] = useState(false)
  const name = mon.nickname || mons.get(mon.species)?.name || mon.species

  async function run(action: () => Promise<Result>) {
    closeMenu()
    report(await action())
  }

  function onRelease() {
    if (!confirming) {
      setConfirming(true) // first click arms it
      return
    }
    if (selectedUid === mon.uid) useUi.setState({ selectedUid: null })
    run(() => remove(mon.uid))
  }

  const item =
    'block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-slate-700'

  return (
    <>
      {/* invisible layer: clicking anywhere else closes the menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={closeMenu}
        onContextMenu={(e) => {
          e.preventDefault()
          closeMenu()
        }}
      />
      <div
        role="menu"
        className="fixed z-50 w-52 rounded-lg border border-slate-700 bg-slate-900 p-1 text-slate-100 shadow-2xl"
        style={{
          left: Math.min(x, window.innerWidth - WIDTH - 8),
          top: Math.min(y, window.innerHeight - 180),
        }}
      >
        <p className="truncate px-3 py-1 text-xs text-slate-400">{name}</p>
        {mon.place === 'team' ? (
          <button
            role="menuitem"
            className={item}
            onClick={() => run(() => sendToBox(mon.uid))}
          >
            📦 Move to Box
          </button>
        ) : (
          teamId && (
            <button
              role="menuitem"
              className={item}
              onClick={() => run(() => sendToTeam(mon.uid, teamId, game))}
            >
              ➕ Add to team
            </button>
          )
        )}
        <button
          role="menuitem"
          className={item}
          onClick={() => run(() => copy(mon.uid))}
        >
          📄 Clone to Box
        </button>
        <button
          role="menuitem"
          onClick={onRelease}
          className={`${item} ${confirming ? 'bg-red-600 font-semibold hover:bg-red-500' : 'text-red-300'}`}
        >
          {confirming ? 'Click again to release' : '🗑️ Release'}
        </button>
      </div>
    </>
  )
}
