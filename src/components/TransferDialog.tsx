import { useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { transferToTeam } from '../db/actions'
import { db } from '../db/db'
import { applyFixes, checkEntry, gameName } from '../lib/conflicts'
import { useGame, useGameGen, useMons, useNames } from '../lib/data'
import { homeSprite } from '../lib/sprites'
import { report } from '../store/report'
import { useUi } from '../store/ui'

/** "Move Cubone to Sun / Moon?" with the list of changes, or why it can't move. */
export function TransferDialog() {
  const transfer = useUi((s) => s.transfer)
  if (!transfer) return null
  return <Dialog key={transfer.uid} uid={transfer.uid} slot={transfer.slot} />
}

function Dialog({ uid, slot }: { uid: string; slot: number }) {
  const { game, teamId, closeTransfer } = useUi()
  const mons = useMons()
  const gameData = useGame(game)
  const gen = useGameGen(game)
  const names = useNames()
  const mon = useLiveQuery(() => db.pokemon.get(uid), [uid])

  const check = useMemo(
    () =>
      mon
        ? checkEntry(mon, game, { mons, game: gameData, gen, names })
        : undefined,
    [mon, game, mons, gameData, gen, names],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeTransfer()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeTransfer])

  if (!mon || !check) return null
  const entry = mons.get(mon.species)
  const name = mon.nickname || entry?.name || mon.species
  const blocked = check.blockers.length > 0

  async function confirm() {
    if (!mon || !check || !teamId) return
    const fixed = applyFixes(mon, game, check.fixes) // VC conversion etc. happens here
    closeTransfer()
    report(await transferToTeam(fixed, teamId, slot))
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={closeTransfer}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-slate-900 p-5 text-slate-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <img
            src={homeSprite(entry?.pokeapiId ?? 0, mon.shiny)}
            alt=""
            className="h-16 w-16 object-contain"
          />
          <div>
            <h3 className="text-lg font-bold">
              {blocked
                ? `${name} can't move to ${gameName(game)}`
                : `Move ${name} to ${gameName(game)}?`}
            </h3>
            <p className="text-sm text-slate-400">
              From {gameName(mon.game)}
              {mon.originGame !== mon.game &&
                ` · caught in ${gameName(mon.originGame)}`}
            </p>
          </div>
        </div>

        {blocked ? (
          <ul className="mt-4 space-y-1 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
            {check.blockers.map((b) => (
              <li key={b}>✕ {b}</li>
            ))}
          </ul>
        ) : (
          <>
            {check.fixes.length ? (
              <div className="mt-4">
                <p className="mb-2 text-sm text-slate-300">
                  These changes will be made:
                </p>
                <ul className="space-y-1 rounded-lg bg-slate-800 p-3 text-sm">
                  {check.fixes.map((f) => (
                    <li key={f.message}>• {f.message}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-green-400">
                ✅ No changes needed.
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Transfers are one-way: it can't go back to older games. Want to
              keep the original? Cancel, right-click it, choose Clone, and move
              the copy.
            </p>
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={closeTransfer}
            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            {blocked ? 'Close' : 'Cancel'}
          </button>
          {!blocked && (
            <button
              onClick={confirm}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
            >
              {check.fixes.length ? 'Fix and move' : 'Move'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
