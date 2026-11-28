import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  copy,
  remove,
  sendToBox,
  sendToTeam,
  update,
  type Result,
} from '../db/actions'
import { db, type StoredPokemon } from '../db/db'
import { useGame, useGameGen, useMons } from '../lib/data'
import { evolutionOptions, evolve, type Evolution } from '../lib/evolution'
import { useEvolutions } from '../lib/evolutionData'
import { report } from '../store/report'
import { useUi } from '../store/ui'

const WIDTH = 256 // w-64
const ITEM_HEIGHT = 34

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
  const { teamId, game, selectedUid, closeMenu, notify } = useUi()
  const mons = useMons()
  // the Pokémon's own game (a Box Pokémon may be from another game than the one selected)
  const gameData = useGame(mon.game)
  const gen = useGameGen(mon.game)
  const evolutions = useEvolutions()

  const name = mon.nickname || mons.get(mon.species)?.name || mon.species
  const options = evolutionOptions(mon.species, evolutions, gameData)

  async function run(action: () => Promise<Result>) {
    closeMenu()
    report(await action())
  }

  async function onEvolve(evo: Evolution) {
    closeMenu()
    const evolved = evolve(
      mon,
      evo,
      gen.species[mon.species],
      gen.species[evo.to],
    )
    const result = await update(mon.uid, {
      species: evolved.species,
      ability: evolved.ability,
      level: evolved.level,
    })
    if (result.ok !== true) return report(result)
    const toName = mons.get(evo.to)?.name ?? evo.to
    const raised =
      evolved.level > mon.level ? ` Level raised to ${evolved.level}.` : ''
    notify(`✨ ${name} evolved into ${toName}!${raised}`)
  }

  function onRelease() {
    if (selectedUid === mon.uid) useUi.setState({ selectedUid: null })
    run(() => remove(mon.uid))
  }

  const item =
    'block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-slate-700'
  const height = 40 + (3 + options.length) * ITEM_HEIGHT

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
        className="fixed z-50 w-64 rounded-lg border border-slate-700 bg-slate-900 p-1 text-slate-100 shadow-2xl"
        style={{
          left: Math.min(x, window.innerWidth - WIDTH - 8),
          top: Math.max(8, Math.min(y, window.innerHeight - height - 8)),
        }}
      >
        <p className="truncate px-3 py-1 text-xs text-slate-400">{name}</p>

        {options.map((evo) => (
          <button
            key={evo.to}
            role="menuitem"
            className={item}
            onClick={() => onEvolve(evo)}
          >
            ✨ Evolve into {mons.get(evo.to)?.name ?? evo.to}{' '}
            <span className="text-xs text-slate-400">({evo.method})</span>
          </button>
        ))}
        {options.length > 0 && (
          <div className="my-1 border-t border-slate-800" />
        )}

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
          className={`${item} text-red-300 hover:bg-red-600 hover:text-white`}
        >
          🗑️ Release
        </button>
      </div>
    </>
  )
}
