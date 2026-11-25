import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { updatePokemon } from '../../db/repo'
import { statGen, useCore, useGameGen, useMons } from '../../lib/data'
import { activeFormId, itemForms } from '../../lib/forms'
import { ALL_GAMES } from '../../lib/games'
import { gameFeatures, UNIVERSAL } from '../../lib/rules'
import { animatedSprite, homeSprite } from '../../lib/sprites'
import { isShinyDVs } from '../../lib/stats'
import type { Pokemon } from '../../lib/types'
import { useUi } from '../../store/ui'
import { IconSelect } from '../IconSelect'
import { Sprite } from '../Sprite'
import { TypeBadge } from '../TypeBadge'
import { StatsEditor } from './StatsEditor'

const SHINY_DVS: Pokemon['dvs'] = [10, 10, 10, 10] // Gen 2 shiny pattern
const NORMAL_DVS: Pokemon['dvs'] = [15, 15, 15, 15]
const control =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm'

/** Label on the left, control on the right — one row per field. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-center gap-3 text-sm">
      <span className="text-xs text-slate-400">{label}</span>
      {children}
    </div>
  )
}

export function DetailsPanel() {
  const uid = useUi((s) => s.selectedUid)
  const mon = useLiveQuery(() => (uid ? db.pokemon.get(uid) : undefined), [uid])
  if (!uid || !mon) {
    return (
      <p className="text-slate-500">
        Select a Pokémon to see its details. (The team overview comes in #12.)
      </p>
    )
  }
  // key = uid: switching Pokémon resets local state like the form preview
  return <Details key={mon.uid} mon={mon} />
}

function Details({ mon }: { mon: Pokemon }) {
  const mons = useMons()
  const core = useCore()
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

  return (
    <div className="space-y-6">
      {/* ================================================================ top: sprite card | fields (50 / 50) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ---------------------------------------------------------------- sprite card */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-800/60 p-4">
          {/* Animated GIF at up to 2× its size (smooth); never larger than the box. HOME render is the fallback. */}
          <div className="grid h-80 w-full place-items-center">
            {shown && (
              <Sprite
                key={`${shown.id}-${mon.shiny}`}
                srcs={[
                  animatedSprite(shown, mon.shiny),
                  homeSprite(shown.pokeapiId, mon.shiny),
                ]}
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
          </p>

          {/* form toggle */}
          {forms.length > 1 && (
            <div className="mt-4 w-full max-w-xs space-y-2">
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

        {/* ---------------------------------------------------------------- fields, one per row */}
        <div className="flex flex-col gap-2.5">
          {game && game.versions.length > 1 && (
            <Field label="Version">
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
          <Field label={`Nickname (max ${f.nicknameMax})`}>
            <input
              value={mon.nickname}
              maxLength={f.nicknameMax}
              placeholder={entry?.name}
              onChange={(e) => set({ nickname: e.target.value })}
              className={control}
            />
          </Field>
          <Field label="Level">
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

          {f.gender && (
            <Field label="Gender">
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
            <Field label="Ability">
              <div>
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
                {shownId !== mon.species && (
                  <p className="mt-1 text-xs text-slate-500">
                    In battle: {shownSpecies?.abilities['0']}
                  </p>
                )}
              </div>
            </Field>
          )}

          {f.nature && (
            <Field label="Nature">
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
                      : ' (neutral)'}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Held item">
            <IconSelect
              options={heldItems}
              value={mon.item}
              onChange={(item) => set({ item })}
              disabled={!f.heldItem}
            />
          </Field>

          {f.ball && (
            <Field label="Poké Ball">
              <IconSelect
                options={balls}
                value={mon.ball}
                onChange={(ball) => set({ ball })}
                noneLabel="—"
              />
            </Field>
          )}

          {f.tera && (
            <Field label="Tera type">
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

          {/* shiny: Gen 3+ checkbox · Gen 2 decided by DVs · Gen 1 "shiny after transfer" */}
          <Field label="Shiny">
            <div className="text-sm">
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
                  <span className="rounded bg-amber-500/20 px-2 py-1 text-amber-300">
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

          {/* record-keeping (not checked) */}
          <Field label="Met location">
            <input
              value={mon.metLocation}
              onChange={(e) => set({ metLocation: e.target.value })}
              className={control}
            />
          </Field>
          <Field label="Met level">
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
          <Field label="OT">
            <input
              value={mon.ot}
              onChange={(e) => set({ ot: e.target.value })}
              className={control}
            />
          </Field>
          <Field label="Trainer ID">
            <input
              value={mon.tid}
              onChange={(e) => set({ tid: e.target.value })}
              className={control}
            />
          </Field>
        </div>
      </div>

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
