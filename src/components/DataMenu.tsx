import { useRef, useState, type ChangeEvent } from 'react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  exportBackup,
  importBackup,
  parseBackup,
  type Backup,
} from '../db/backup'
import { boxContents, teamMembers } from '../db/repo'
import { useMons, useNames } from '../lib/data'
import { downloadText } from '../lib/download'
import { toShowdownTeam } from '../lib/showdown'
import { useUi } from '../store/ui'

const item =
  'block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-700'

export function DataMenu() {
  const teamId = useUi((s) => s.teamId)
  const notify = useUi((s) => s.notify)
  const mons = useMons()
  const names = useNames()
  const team =
    useLiveQuery(() => (teamId ? teamMembers(teamId) : []), [teamId]) ?? []
  const box = useLiveQuery(boxContents) ?? []
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)

  const ctx = { speciesName: (id: string) => mons.get(id)?.name ?? id, names }

  async function copyShowdown(
    list: typeof team,
    what: string,
    filename: string,
  ) {
    if (!list.length) return notify(`⚠️ The ${what} is empty.`)
    const text = toShowdownTeam(list, ctx)
    try {
      await navigator.clipboard.writeText(text)
      notify(
        `✅ ${list.length} Pokémon copied in Showdown format. Paste into Showdown or PKHeX.`,
      )
    } catch {
      downloadText(filename, text) // clipboard blocked → save a file instead
      notify(`✅ Saved ${filename}.`)
    }
  }

  async function backup() {
    const data = await exportBackup()
    downloadText(
      `pokemon-backup-${data.exportedAt.slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json',
    )
    notify(
      `✅ Backup saved: ${data.pokemon.length} Pokémon, ${data.teams.length} teams.`,
    )
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // lets you pick the same file again later
    if (!file) return
    try {
      setPending(parseBackup(JSON.parse(await file.text())))
    } catch (err) {
      notify(
        `⚠️ ${err instanceof SyntaxError ? "That file isn't valid JSON." : (err as Error).message}`,
      )
    }
  }

  async function restore(mode: 'merge' | 'replace') {
    const data = pending
    setPending(null)
    if (!data) return
    try {
      const r = await importBackup(data, mode)
      notify(`✅ Restored ${r.pokemon} Pokémon and ${r.teams} teams.`)
    } catch (err) {
      notify(`⚠️ ${(err as Error).message}`)
    }
  }

  return (
    <>
      <Popover className="relative">
        <PopoverButton className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800">
          Data ▾
        </PopoverButton>
        {/* portal → set colours explicitly */}
        <PopoverPanel
          anchor="bottom end"
          className="z-50 w-64 rounded-lg border border-slate-700 bg-slate-900 p-1 text-slate-100 shadow-2xl [--anchor-gap:6px]"
        >
          {({ close }) => (
            <>
              <button
                className={item}
                onClick={() => (
                  close(),
                  copyShowdown(team, 'team', 'team.txt')
                )}
              >
                📋 Copy team (Showdown)
              </button>
              <button
                className={item}
                onClick={() => (close(), copyShowdown(box, 'Box', 'box.txt'))}
              >
                📋 Copy Box (Showdown)
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button className={item} onClick={() => (close(), backup())}>
                💾 Download backup (.json)
              </button>
              <button
                className={item}
                onClick={() => (close(), fileInput.current?.click())}
              >
                📂 Restore backup…
              </button>
            </>
          )}
        </PopoverPanel>
      </Popover>

      {/* hidden file picker, opened by "Restore backup…" */}
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={onFile}
      />

      {pending && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          onClick={() => setPending(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-slate-900 p-5 text-slate-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Restore backup?</h3>
            <p className="mt-1 text-sm text-slate-400">
              {pending.pokemon.length} Pokémon and {pending.teams.length} teams,
              saved {new Date(pending.exportedAt).toLocaleString()}.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <b>Merge</b>: keep everything you have and add what's new.
              </li>
              <li>
                <b className="text-red-300">Replace everything</b>: delete what
                you have now and load the backup.
              </li>
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPending(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => restore('replace')}
                className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
              >
                Replace everything
              </button>
              <button
                onClick={() => restore('merge')}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
