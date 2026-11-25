import { calcStats, hpDV } from '../../lib/stats'
import type { GameFeatures } from '../../lib/rules'
import type { Nature, Pokemon, StatTuple } from '../../lib/types'

const LABELS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe']
const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
const EV_TOTAL = 510
const MAX_BASE = 255 // for the base-stat bars

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo))
const input =
  'w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-right text-sm'
const card = 'grid gap-6 rounded-2xl bg-slate-800/40 p-4 md:grid-cols-2'
const rightHalf = 'md:border-l md:border-slate-700/60 md:pl-6' // divider between the halves
const head =
  'mb-1 h-5 text-xs font-semibold uppercase tracking-wider text-slate-400'
const row = 'h-9 items-center gap-3' // same height in both halves so rows line up
const foot = 'mt-2 h-4 text-xs text-slate-500'

interface Props {
  mon: Pokemon
  base: StatTuple
  /** Base stats to compare against (e.g. the base form while previewing a Mega). */
  compare?: StatTuple
  gen: number
  features: GameFeatures
  natures: Nature[]
  set: (changes: Partial<Pokemon>) => void
}

export function StatsEditor(props: Props) {
  return props.features.statSystem === 'dv' ? (
    <DvStats {...props} />
  ) : (
    <IvEvStats {...props} />
  )
}

/** Bar showing a base stat (green = high, red = low). */
function BaseBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right text-slate-400">{value}</span>
      <div className="h-1.5 flex-1 rounded bg-slate-700">
        <div
          className="h-1.5 rounded"
          style={{
            width: `${(value / MAX_BASE) * 100}%`,
            background: `hsl(${Math.min(value, 150) * 0.8} 70% 50%)`,
          }}
        />
      </div>
    </div>
  )
}

/** Gen 3+ (and Let's Go, as AVs). Left half: stats. Right half: EVs. */
function IvEvStats({ mon, base, compare, gen, features, natures, set }: Props) {
  const stats = calcStats(gen, base, mon, natures)
  const compareStats = compare ? calcStats(gen, compare, mon, natures) : null
  const nature = natures.find((n) => n.name === mon.nature)
  const evTotal = mon.evs.reduce((a, b) => a + b, 0)
  const label = features.statSystem === 'av' ? 'AV' : 'EV'

  function setIv(i: number, v: number) {
    const ivs = [...mon.ivs] as StatTuple
    ivs[i] = clamp(v, 0, 31)
    set({ ivs })
  }
  function setEv(i: number, v: number) {
    const evs = [...mon.evs] as StatTuple
    const othersTotal = evTotal - evs[i]
    // can't exceed the per-stat cap or what's left of the 510 total
    evs[i] = clamp(
      v,
      0,
      Math.min(features.evPerStatMax, EV_TOTAL - othersTotal),
    )
    set({ evs })
  }
  const colorOf = (i: number) =>
    nature?.plus === KEYS[i]
      ? 'text-red-400'
      : nature?.minus === KEYS[i]
        ? 'text-sky-400'
        : ''

  return (
    <div className={card}>
      {/* ---------------------------------------------------------------- stats */}
      <div>
        <div
          className={`${head} grid grid-cols-[2.5rem_1fr_4rem_5.5rem] gap-3`}
        >
          <span>Stat</span>
          <span>Base</span>
          <span className="text-right">IV</span>
          <span className="text-right">Total</span>
        </div>
        {LABELS.map((name, i) => {
          const diff = compareStats ? stats[i] - compareStats[i] : 0
          return (
            <div
              key={name}
              className={`${row} grid grid-cols-[2.5rem_1fr_4rem_5.5rem]`}
            >
              <span className={`font-semibold ${colorOf(i)}`}>{name}</span>
              <BaseBar value={base[i]} />
              <input
                type="number"
                min={0}
                max={31}
                value={mon.ivs[i]}
                onChange={(e) => setIv(i, +e.target.value)}
                className={input}
              />
              <span className={`text-right font-mono font-bold ${colorOf(i)}`}>
                {stats[i]}
                {diff !== 0 && (
                  <span
                    className={`ml-1 text-xs ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {diff > 0 ? '+' : ''}
                    {diff}
                  </span>
                )}
              </span>
            </div>
          )
        })}
        <p className={foot}>
          <span className="text-red-400">Red</span> = boosted by nature,{' '}
          <span className="text-sky-400">blue</span> = lowered
        </p>
      </div>

      {/* ---------------------------------------------------------------- EVs */}
      <div className={rightHalf}>
        <div className={`${head} grid grid-cols-[4.5rem_1fr] gap-3`}>
          <span className="text-right">{label}s</span>
          <span>max {features.evPerStatMax} per stat</span>
        </div>
        {LABELS.map((name, i) => (
          <div key={name} className={`${row} grid grid-cols-[4.5rem_1fr]`}>
            <input
              type="number"
              min={0}
              max={features.evPerStatMax}
              step={4}
              value={mon.evs[i]}
              onChange={(e) => setEv(i, +e.target.value)}
              className={input}
              aria-label={`${name} ${label}`}
            />
            <input
              type="range"
              min={0}
              max={features.evPerStatMax}
              step={4}
              value={mon.evs[i]}
              onChange={(e) => setEv(i, +e.target.value)}
              className="w-full accent-red-500"
              aria-label={`${name} ${label} slider`}
            />
          </div>
        ))}
        <p
          className={`${foot} text-right ${evTotal === EV_TOTAL ? 'text-amber-400' : ''}`}
        >
          {label}s used: {evTotal} / {EV_TOTAL}
        </p>
      </div>
    </div>
  )
}

/** Gen 1–2: DVs (0–15) and stat experience (0–65535). HP DV is derived. Same one-card layout. */
function DvStats({ mon, base, gen, natures, set }: Props) {
  const stats = calcStats(gen, base, mon, natures)
  const rows: {
    label: string
    base: number
    total: string
    dv?: number
    se: number
  }[] = [
    { label: 'HP', base: base[0], total: `${stats[0]}`, se: 0 },
    { label: 'Atk', base: base[1], total: `${stats[1]}`, dv: 0, se: 1 },
    { label: 'Def', base: base[2], total: `${stats[2]}`, dv: 1, se: 2 },
    { label: 'Spe', base: base[5], total: `${stats[5]}`, dv: 2, se: 3 },
    gen === 1
      ? { label: 'Spc', base: base[3], total: `${stats[3]}`, dv: 3, se: 4 }
      : {
          label: 'SpA/SpD',
          base: base[3],
          total: `${stats[3]}/${stats[4]}`,
          dv: 3,
          se: 4,
        },
  ]

  function setDv(i: number, v: number) {
    const dvs = [...mon.dvs] as Pokemon['dvs']
    dvs[i] = clamp(v, 0, 15)
    set({ dvs })
  }
  function setStatExp(i: number, v: number) {
    const statExp = [...mon.statExp] as Pokemon['statExp']
    statExp[i] = clamp(v, 0, 65535)
    set({ statExp })
  }

  return (
    <div className={card}>
      {/* ---------------------------------------------------------------- stats + DVs */}
      <div>
        <div className={`${head} grid grid-cols-[4rem_1fr_4rem_5.5rem] gap-3`}>
          <span>Stat</span>
          <span>Base</span>
          <span className="text-right">DV</span>
          <span className="text-right">Total</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.label}
            className={`${row} grid grid-cols-[4rem_1fr_4rem_5.5rem]`}
          >
            <span className="font-semibold">{r.label}</span>
            <BaseBar value={r.base} />
            {r.dv === undefined ? (
              <span
                className="text-right text-slate-500"
                title="The HP DV is built from the other four DVs"
              >
                {hpDV(mon.dvs)}
              </span>
            ) : (
              <input
                type="number"
                min={0}
                max={15}
                value={mon.dvs[r.dv]}
                onChange={(e) => setDv(r.dv!, +e.target.value)}
                className={input}
              />
            )}
            <span className="text-right font-mono font-bold">{r.total}</span>
          </div>
        ))}
        <p className={foot}>
          Gen {gen} uses DVs (0–15). The HP DV is calculated.
        </p>
      </div>

      {/* ---------------------------------------------------------------- stat experience */}
      <div className={rightHalf}>
        <div className={`${head} grid grid-cols-[5.5rem_1fr] gap-3`}>
          <span className="text-right">Stat exp</span>
          <span>max 65535</span>
        </div>
        {rows.map((r) => (
          <div key={r.label} className={`${row} grid grid-cols-[5.5rem_1fr]`}>
            <input
              type="number"
              min={0}
              max={65535}
              step={256}
              value={mon.statExp[r.se]}
              onChange={(e) => setStatExp(r.se, +e.target.value)}
              className={input}
              aria-label={`${r.label} stat exp`}
            />
            <input
              type="range"
              min={0}
              max={65535}
              step={256}
              value={mon.statExp[r.se]}
              onChange={(e) => setStatExp(r.se, +e.target.value)}
              className="w-full accent-red-500"
              aria-label={`${r.label} stat exp slider`}
            />
          </div>
        ))}
        <p className={foot}>No total cap in Gen 1–2.</p>
      </div>
    </div>
  )
}
