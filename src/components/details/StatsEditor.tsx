import { calcStats, hpDV } from '../../lib/stats'
import type { GameFeatures } from '../../lib/rules'
import type { Nature, Pokemon, StatTuple } from '../../lib/types'

const LABELS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe']
const KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
const EV_TOTAL = 510

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo))
const input =
  'w-16 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-right text-sm'

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

/** Gen 3+ (and Let's Go, as AVs). */
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

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="text-left font-normal">Stat</th>
            <th className="font-normal">Base</th>
            <th className="font-normal">IV (0–31)</th>
            <th className="font-normal" colSpan={2}>
              {label} (max {features.evPerStatMax})
            </th>
            <th className="text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {LABELS.map((name, i) => {
            const color =
              nature?.plus === KEYS[i]
                ? 'text-red-400'
                : nature?.minus === KEYS[i]
                  ? 'text-sky-400'
                  : ''
            const diff = compareStats ? stats[i] - compareStats[i] : 0
            return (
              <tr key={name}>
                <td className={`py-1 font-semibold ${color}`}>{name}</td>
                <td className="text-center text-slate-400">{base[i]}</td>
                <td className="text-center">
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={mon.ivs[i]}
                    onChange={(e) => setIv(i, +e.target.value)}
                    className={input}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="number"
                    min={0}
                    max={features.evPerStatMax}
                    step={4}
                    value={mon.evs[i]}
                    onChange={(e) => setEv(i, +e.target.value)}
                    className={input}
                  />
                </td>
                <td className="w-full px-2">
                  <input
                    type="range"
                    min={0}
                    max={features.evPerStatMax}
                    step={4}
                    value={mon.evs[i]}
                    onChange={(e) => setEv(i, +e.target.value)}
                    className="w-full accent-red-500"
                  />
                </td>
                <td
                  className={`whitespace-nowrap text-right font-mono font-bold ${color}`}
                >
                  {stats[i]}
                  {diff !== 0 && (
                    <span
                      className={`ml-1 text-xs ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      ({diff > 0 ? '+' : ''}
                      {diff})
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p
        className={`mt-2 text-right text-xs ${evTotal === EV_TOTAL ? 'text-amber-400' : 'text-slate-500'}`}
      >
        {label}s used: {evTotal} / {EV_TOTAL}
      </p>
    </div>
  )
}

/** Gen 1–2: DVs (0–15) and stat experience (0–65535). HP DV is derived. */
function DvStats({ mon, base, gen, natures, set }: Props) {
  const stats = calcStats(gen, base, mon, natures)
  const rows: {
    label: string
    base: string
    total: string
    dv?: number
    se: number
  }[] = [
    { label: 'HP', base: `${base[0]}`, total: `${stats[0]}`, se: 0 },
    { label: 'Atk', base: `${base[1]}`, total: `${stats[1]}`, dv: 0, se: 1 },
    { label: 'Def', base: `${base[2]}`, total: `${stats[2]}`, dv: 1, se: 2 },
    { label: 'Spe', base: `${base[5]}`, total: `${stats[5]}`, dv: 2, se: 3 },
    gen === 1
      ? {
          label: 'Special',
          base: `${base[3]}`,
          total: `${stats[3]}`,
          dv: 3,
          se: 4,
        }
      : {
          label: 'SpA / SpD',
          base: `${base[3]} / ${base[4]}`,
          total: `${stats[3]} / ${stats[4]}`,
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
    <div>
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="text-left font-normal">Stat</th>
            <th className="font-normal">Base</th>
            <th className="font-normal">DV (0–15)</th>
            <th className="font-normal">Stat exp (0–65535)</th>
            <th className="text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="py-1 font-semibold">{r.label}</td>
              <td className="text-center text-slate-400">{r.base}</td>
              <td className="text-center">
                {r.dv === undefined ? (
                  <span
                    className="text-slate-500"
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
              </td>
              <td className="text-center">
                <input
                  type="number"
                  min={0}
                  max={65535}
                  step={256}
                  value={mon.statExp[r.se]}
                  onChange={(e) => setStatExp(r.se, +e.target.value)}
                  className={`${input} w-24`}
                />
              </td>
              <td className="text-right font-mono font-bold">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500">
        Gen {gen} uses DVs and stat experience instead of IVs/EVs.
      </p>
    </div>
  )
}
