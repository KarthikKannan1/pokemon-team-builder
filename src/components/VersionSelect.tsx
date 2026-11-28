import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react'
import { GAME_GROUPS, type GameGroup } from '../lib/games'
import { UNIVERSAL } from '../lib/rules'
import { badgeBackground, VERSION_COLORS } from '../lib/versionColors'
import { useUi } from '../store/ui'

/** Generation → its dropdown groups, in order. */
const BY_GEN = GAME_GROUPS.reduce((map, group) => {
  map.set(group.gen, [...(map.get(group.gen) ?? []), group])
  return map
}, new Map<number, GameGroup[]>())

const HOME_LABEL = 'Pokémon HOME (universal)'

/** Small colour chip; paired versions (X / Y) are split diagonally. */
function GameBadge({ group }: { group?: GameGroup }) {
  const colors = group
    ? [...new Set(group.games.flatMap((g) => g.versions))].map(
        (v) => VERSION_COLORS[v],
      )
    : ['#64748b'] // HOME: neutral slate
  return (
    <span
      aria-hidden
      className="h-3.5 w-5 shrink-0 rounded-sm ring-1 ring-white/20"
      style={{ background: badgeBackground(colors) }}
    />
  )
}

export function VersionSelect() {
  const game = useUi((s) => s.game)
  const setGame = useUi((s) => s.setGame)

  // The dropdown shows groups; each group is represented by its first game.
  // (The exact version — Ruby vs Emerald — is chosen per Pokémon in the details panel.)
  const group =
    game === UNIVERSAL
      ? undefined
      : GAME_GROUPS.find((g) => g.games.some((x) => x.id === game))
  const current = group ? group.games[0].id : game

  return (
    <Listbox value={current} onChange={setGame}>
      <ListboxButton className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 data-focus:outline-2 data-focus:outline-sky-400">
        <GameBadge group={group} />
        <span>{group?.name ?? HOME_LABEL}</span>
        <span aria-hidden className="ml-1 text-slate-400">
          ▾
        </span>
      </ListboxButton>

      {/* Rendered in a portal (outside our layout), so colours are set explicitly */}
      <ListboxOptions
        anchor="bottom start"
        className="z-50 max-h-[70vh] min-w-(--button-width) overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-1 shadow-xl [--anchor-gap:4px] focus:outline-none"
      >
        <Option value={UNIVERSAL} label={HOME_LABEL} />
        {[...BY_GEN].map(([gen, groups]) => (
          <div key={gen} role="group" aria-label={`Generation ${gen}`}>
            <div className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Generation {gen}
            </div>
            {groups.map((g) => (
              <Option
                key={g.id}
                value={g.games[0].id}
                label={g.name}
                group={g}
              />
            ))}
          </div>
        ))}
      </ListboxOptions>
    </Listbox>
  )
}

function Option({
  value,
  label,
  group,
}: {
  value: string
  label: string
  group?: GameGroup
}) {
  return (
    <ListboxOption
      value={value}
      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-100 data-focus:bg-slate-800 data-selected:font-semibold data-selected:text-sky-300"
    >
      <GameBadge group={group} />
      <span>{label}</span>
    </ListboxOption>
  )
}
