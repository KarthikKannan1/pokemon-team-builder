import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { updatePokemon } from '../../db/repo'
import { baseStatTotal } from '../../lib/bst'
import { statGen, useCore, useGameGen, useMons, useNames } from '../../lib/data'
import { activeFormId, itemForms } from '../../lib/forms'
import { ALL_GAMES } from '../../lib/games'
import {
  eventChoices,
  OBTAINED_LABEL,
  obtainedChoices,
  speciesEvents,
} from '../../lib/obtained'
import { gameFeatures, UNIVERSAL } from '../../lib/rules'
import { monSprites } from '../../lib/sprites'
import { isShinyDVs } from '../../lib/stats'
import type { Obtained, Pokemon } from '../../lib/types'
import { useUi } from '../../store/ui'
import { IconSelect } from '../IconSelect'
import { InfoPopover } from '../InfoPopover'
import { Sprite } from '../Sprite'
import { TypeBadge } from '../TypeBadge'
import { MovesSection } from './MovesSection'
import { StatsEditor } from './StatsEditor'
import { TeamOverview } from './TeamOverview'

const SHINY_DVS: Pokemon['dvs'] = [10, 10, 10, 10] // Gen 2 shiny pattern
const NORMAL_DVS: Pokemon['dvs'] = [15, 15, 15, 15]
const control =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm'

/**
 * At least as tall as the team grid (3 cards × 10rem + 2 × 0.5rem gaps) so the panels line up,
 * but allowed to grow (e.g. when the Event field appears) instead of hiding fields.
 */
const TOP_ROW_HEIGHT = 'lg:min-h-[31rem]'

const SPAN = {
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  6: 'col-span-6',
} as const

/** Small label above its control. `span` = columns out of 6 (2 = third, 3 = half, 6 = full row). */
function Field({
  label,
  span,
  children,
}: {
  label: string
  span: keyof typeof SPAN
  children: ReactNode
}) {
  return (
    <div className={`${SPAN[span]} flex flex-col gap-1`}>
      <span className="text-xs text-slate-400">{label}</span>
      {children}
    </div>
  )
}

/** A control with an ⓘ to its right. */
function WithInfo({
  children,
  info,
}: {
  children: ReactNode
  info?: ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      {info}
    </div>
  )
}

export function DetailsPanel() {
  const uid = useUi((s) => s.selectedUid)
  const mon = useLiveQuery(() => (uid ? db.pokemon.get(uid) : undefined), [uid])
  // nothing selected → team overview
  if (!uid || !mon) return <TeamOverview />
  // key = uid: switching Pokémon resets local state like the form preview
  return <Details key={mon.uid} mon={mon} />
}

function Details({ mon }: { mon: Pokemon }) {
  const mons = useMons()
  const core = useCore()
  const names = useNames()
  const gen = useGameGen(mon.game)
  const f = gameFeatures(mon.game)
  const game = ALL_GAMES.find((g) => g.id === mon.game)
  const set = (changes: Partial<Pokemon>) => updatePokemon(mon.uid, changes)

  // ---- forms: Base / Mega X / Mega Y (only in games with Megas)
  const forms = f.mega ? itemForms(mon.species, gen, mons) : []
  const activeId = activeFormId(mon, gen, mons)
  const [preview, setPreview] = useState<string | null>(null)
  const shownId =
    preview && forms.some((x) => x.id === preview) ? preview : activeId
  const shownForm = forms.find((x) => x.id === shownId)
  const heldStone = forms.find((x) => x.stone === mon.item)

  const entry = mons.get(mon.species)
  const shown = mons.get(shownId) ?? entry
  const baseSpecies = gen.species[mon.species]
  const shownSpecies = gen.species[shownId] ?? baseSpecies

  const abilities = Object.entries(baseSpecies?.abilities ?? {})
  const allItems = Object.entries(gen.items)
    .map(([id, it]) => ({
      id,
      name: it.name,
      icon: it.icon,
      isBall: it.isBall,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const heldItems = allItems.filter((i) => !i.isBall)
  const balls = allItems.filter((i) => i.isBall)
  const heldItem = gen.items[mon.item]
  const battleAbility =
    shownId !== mon.species ? shownSpecies?.abilities['0'] : undefined

  // ---- how it was obtained
  const obtained: Obtained = mon.obtained ?? 'caught'
  const events = eventChoices(
    speciesEvents(core.events, mon.species, entry?.baseSpecies),
    mon.game,
  )
  const eventLabel = (e: (typeof events)[number]['event']) =>
    `Gen ${e.gen} · Lv ${e.level} · ${e.moves.map((m) => names.moves[m] ?? m).join(', ') || 'no special moves'}`

  // ---- Ball | Shiny | Tera share one row: thirds with Tera, halves without
  const third = f.tera ? 2 : 3

  return (
    <div className="space-y-6">
      {/* ================================================================ top: sprite card | fields (50 / 50) */}
      <div className={`grid gap-6 md:grid-cols-2 ${TOP_ROW_HEIGHT}`}>
        {/* ---------------------------------------------------------------- sprite card */}
        <div className="flex h-full min-h-80 flex-col items-center rounded-2xl bg-slate-800/60 p-4">
          {/* Animated GIF at up to 2× its size (smooth); never larger than the space. HOME render is the fallback. */}
          <div className="grid min-h-0 w-full flex-1 place-items-center">
            {shown && (
              <Sprite
                key={`${shown.id}-${mon.shiny}-${mon.gender}`}
                srcs={monSprites(shown, {
                  shiny: mon.shiny,
                  female: mon.gender === 'F',
                  animated: true,
                })}
                alt={shown.name}
                maxScale={2}
                className="max-h-full max-w-full"
              />
            )}
          </div>
          <h3 className="mt-2 text-2xl font-bold">
            {mon.nickname || entry?.name}
          </h3>
          {(mon.nickname || shownId !== mon.species) && (
            <p className="text-sm text-slate-400">{shown?.name}</p>
          )}
          <div className="mt-2 flex gap-1">
            {(shownSpecies?.types ?? []).map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            #{entry?.num} ·{' '}
            {mon.game === UNIVERSAL ? 'Universal' : `Gen ${f.gen}`}
            {shownSpecies && (
              <>
                {' · '}
                <span className="font-semibold text-slate-300">
                  BST {baseStatTotal(shownSpecies.stats, statGen(mon.game))}
                </span>
              </>
            )}
          </p>

          {/* form toggle */}
          {forms.length > 1 && (
            <div className="mt-3 w-full max-w-xs space-y-2">
              <div className="flex flex-wrap justify-center gap-1">
                {forms.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setPreview(x.id)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      shownId === x.id
                        ? 'bg-red-600 font-semibold'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-slate-400">
                {heldStone
                  ? `Holding ${gen.items[heldStone.stone!].name}`
                  : 'No Mega Stone held'}
              </p>
              {shownForm?.stone && shownForm.stone !== mon.item && (
                <button
                  onClick={() => set({ item: shownForm.stone })}
                  className="w-full rounded-lg border border-red-500 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                >
                  Hold {gen.items[shownForm.stone].name}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- fields: 6-column grid */}
        <div className="grid grid-cols-6 content-start gap-x-3 gap-y-3">
          <Field label={`Nickname (max ${f.nicknameMax})`} span={4}>
            <input
              value={mon.nickname}
              maxLength={f.nicknameMax}
              placeholder={entry?.name}
              onChange={(e) => set({ nickname: e.target.value })}
              className={control}
            />
          </Field>
          <Field label="Level" span={2}>
            <input
              type="number"
              min={1}
              max={100}
              value={mon.level}
              onChange={(e) =>
                set({ level: Math.max(1, Math.min(100, +e.target.value || 1)) })
              }
              className={control}
            />
          </Field>

          {game && game.versions.length > 1 && (
            <Field label="Version" span={3}>
              <select
                value={mon.version}
                onChange={(e) => set({ version: e.target.value })}
                className={`${control} capitalize`}
              >
                {game.versions.map((v) => (
                  <option key={v} value={v}>
                    {v.replace(/-/g, ' ')}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {f.gender && (
            <Field label="Gender" span={3}>
              <select
                value={mon.gender}
                onChange={(e) =>
                  set({ gender: e.target.value as Pokemon['gender'] })
                }
                className={control}
              >
                <option value="">—</option>
                <option value="M">♂ Male</option>
                <option value="F">♀ Female</option>
              </select>
            </Field>
          )}

          {f.ability && (
            <Field
              label={
                battleAbility ? `Ability (battle: ${battleAbility})` : 'Ability'
              }
              span={3}
            >
              <WithInfo
                info={
                  mon.ability && (
                    <InfoPopover label={`${mon.ability} details`}>
                      <p className="font-bold">{mon.ability}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        {names.abilities[mon.ability] ??
                          'No description available.'}
                      </p>
                      {battleAbility && battleAbility !== mon.ability && (
                        <>
                          <p className="mt-3 font-bold">
                            {battleAbility} (in battle)
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-300">
                            {names.abilities[battleAbility]}
                          </p>
                        </>
                      )}
                    </InfoPopover>
                  )
                }
              >
                <select
                  value={mon.ability}
                  onChange={(e) => set({ ability: e.target.value })}
                  className={control}
                >
                  {abilities.map(([slot, name]) => (
                    <option key={slot} value={name}>
                      {name}
                      {slot === 'H' ? ' (Hidden)' : ''}
                    </option>
                  ))}
                </select>
              </WithInfo>
            </Field>
          )}
          {f.nature && (
            <Field label="Nature" span={3}>
              <select
                value={mon.nature}
                onChange={(e) => set({ nature: e.target.value })}
                className={control}
              >
                {core.natures.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name}
                    {n.plus
                      ? ` (+${n.plus.toUpperCase()} −${n.minus!.toUpperCase()})`
                      : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Held item" span={3}>
            <WithInfo
              info={
                heldItem && (
                  <InfoPopover label={`${heldItem.name} details`}>
                    <p className="font-bold">{heldItem.name}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {heldItem.desc || 'No description available.'}
                    </p>
                  </InfoPopover>
                )
              }
            >
              <IconSelect
                options={heldItems}
                value={mon.item}
                onChange={(item) => set({ item })}
                disabled={!f.heldItem}
              />
            </WithInfo>
          </Field>

          {/* ---- one row: Poké Ball | Shiny | Tera */}
          {f.ball && (
            <Field label="Poké Ball" span={third}>
              <IconSelect
                options={balls}
                value={mon.ball}
                onChange={(ball) => set({ ball })}
                noneLabel="—"
              />
            </Field>
          )}
          {/* shiny: Gen 3+ checkbox · Gen 2 decided by DVs · Gen 1 "shiny after transfer" */}
          <Field label="Shiny" span={third}>
            <div className="flex h-[34px] items-center text-sm">
              {f.statSystem !== 'dv' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mon.shiny}
                    onChange={(e) => set({ shiny: e.target.checked })}
                  />{' '}
                  ✨ Shiny
                </label>
              )}
              {f.gen === 2 && (
                <label
                  className="flex items-center gap-2"
                  title="In Gen 2, shininess is decided by DVs"
                >
                  <input
                    type="checkbox"
                    checked={isShinyDVs(mon.dvs)}
                    onChange={(e) =>
                      set({
                        dvs: e.target.checked ? SHINY_DVS : NORMAL_DVS,
                        shiny: e.target.checked,
                      })
                    }
                  />
                  ✨ Shiny (sets DVs)
                </label>
              )}
              {f.gen === 1 &&
                (isShinyDVs(mon.dvs) ? (
                  <span className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
                    ✨ Shiny after transfer
                  </span>
                ) : (
                  <button
                    onClick={() => set({ dvs: SHINY_DVS })}
                    className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                  >
                    Set shiny-on-transfer DVs
                  </button>
                ))}
            </div>
          </Field>
          {f.tera && (
            <Field label="Tera type" span={2}>
              <select
                value={mon.teraType}
                onChange={(e) => set({ teraType: e.target.value })}
                className={control}
              >
                <option value="">—</option>
                {core.types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          )}

          {/* how it was obtained → affects egg moves and event moves */}
          <Field label="Obtained" span={3}>
            <select
              value={obtained}
              onChange={(e) => {
                const next = e.target.value as Obtained
                set({
                  obtained: next,
                  eventIndex: next === 'event' ? events[0]?.index : undefined,
                })
              }}
              className={control}
            >
              {obtainedChoices(mon.game).map((o) => (
                <option key={o} value={o}>
                  {OBTAINED_LABEL[o]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Met location" span={3}>
            <input
              value={mon.metLocation}
              onChange={(e) => set({ metLocation: e.target.value })}
              className={control}
            />
          </Field>

          {obtained === 'event' && (
            <Field label="Event" span={6}>
              {events.length ? (
                <select
                  value={mon.eventIndex ?? ''}
                  onChange={(e) =>
                    set({
                      eventIndex:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                  className={control}
                >
                  <option value="">— pick an event —</option>
                  {events.map((c) => (
                    <option key={c.index} value={c.index}>
                      {eventLabel(c.event)}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="py-1.5 text-sm text-slate-500">
                  No known events for this Pokémon up to this generation.
                </p>
              )}
            </Field>
          )}

          {/* record-keeping (not checked) */}
          <Field label="Met level" span={2}>
            <input
              type="number"
              min={0}
              max={100}
              value={mon.metLevel}
              onChange={(e) =>
                set({
                  metLevel: Math.max(0, Math.min(100, +e.target.value || 0)),
                })
              }
              className={control}
            />
          </Field>
          <Field label="OT" span={2}>
            <input
              value={mon.ot}
              onChange={(e) => set({ ot: e.target.value })}
              className={control}
            />
          </Field>
          <Field label="Trainer ID" span={2}>
            <input
              value={mon.tid}
              onChange={(e) => set({ tid: e.target.value })}
              className={control}
            />
          </Field>
        </div>
      </div>

      {/* ================================================================ moves */}
      <MovesSection mon={mon} set={set} />

      {/* ================================================================ bottom: stats | EVs in one card */}
      {shownSpecies && (
        <StatsEditor
          mon={mon}
          base={shownSpecies.stats}
          compare={shownId !== mon.species ? baseSpecies?.stats : undefined}
          gen={statGen(mon.game)}
          features={f}
          natures={core.natures}
          set={set}
        />
      )}
    </div>
  )
}
