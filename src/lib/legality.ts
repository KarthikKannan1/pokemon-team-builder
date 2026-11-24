import type { GameData, GenData, GenMove, MonEntry, Pokemon } from './types'

export type Group = 'level' | 'tm' | 'tutor' | 'egg'
const METHOD_GROUP = { L: 'level', M: 'tm', T: 'tutor', E: 'egg' } as const
/** Order groups appear in the move picker, and which source "wins". */
export const GROUP_ORDER: Group[] = ['level', 'tm', 'tutor', 'egg']

export interface Source {
  group: Group
  via: string // which species teaches it: 'Dratini'
  level?: number // level-up only
  label?: string // 'TM25'
  ok: boolean // usable at the current level?
}
export interface MoveOption {
  id: string
  move: GenMove
  group: Group // best source's group
  available: boolean
  reason?: string // why it's greyed out
  sources: Source[]
}

export interface LegalityCtx {
  mons: Map<string, MonEntry>
  game: GameData
  gen: GenData
}

/** The species plus its pre-evolutions: Dragonite → Dragonair → Dratini. */
export function evolutionLine(
  mons: Map<string, MonEntry>,
  id: string,
): string[] {
  const line: string[] = []
  let cur: string | undefined = id
  while (cur && !line.includes(cur)) {
    line.push(cur)
    cur = mons.get(cur)?.prevo
  }
  return line
}

export function moveOptions(
  ctx: LegalityCtx,
  mon: Pick<Pokemon, 'species' | 'level'>,
): MoveOption[] {
  const options = new Map<string, MoveOption>()

  for (const member of evolutionLine(ctx.mons, mon.species)) {
    const via = ctx.mons.get(member)?.name ?? member
    for (const [id, method, level] of ctx.game.learn[member] ?? []) {
      const move = ctx.gen.moves[id]
      if (!move) continue
      const group = METHOD_GROUP[method]
      const source: Source =
        group === 'level'
          ? { group, via, level, ok: level <= mon.level }
          : {
              group,
              via,
              label: group === 'tm' ? ctx.game.tm[id] : undefined,
              ok: true,
            }

      let opt = options.get(id)
      if (!opt) {
        opt = { id, move, group, available: false, sources: [] }
        options.set(id, opt)
      }
      opt.sources.push(source)
    }
  }

  // Decide each move's status from its best source
  const rank = (s: Source) =>
    GROUP_ORDER.indexOf(s.group) * 1000 + (s.level ?? 0)
  for (const opt of options.values()) {
    const usable = opt.sources.filter((s) => s.ok)
    opt.available = usable.length > 0
    const best = [...(opt.available ? usable : opt.sources)].sort(
      (a, b) => rank(a) - rank(b),
    )[0]
    opt.group = best.group
    if (!opt.available) {
      const minLevel = Math.min(...opt.sources.map((s) => s.level ?? Infinity))
      opt.reason = `Learns at Lv. ${minLevel}`
    }
  }
  return [...options.values()]
}

export interface Issue {
  level: 'error' | 'warn'
  message: string
}

/** Problems with a Pokémon's current moves in this game. */
export function checkMoves(
  ctx: LegalityCtx,
  mon: Pick<Pokemon, 'species' | 'level' | 'moves'>,
): Issue[] {
  const issues: Issue[] = []
  const opts = new Map(moveOptions(ctx, mon).map((o) => [o.id, o]))
  if (mon.moves.length > 4)
    issues.push({ level: 'error', message: 'More than 4 moves.' })
  if (new Set(mon.moves).size !== mon.moves.length)
    issues.push({ level: 'error', message: 'Duplicate moves.' })
  for (const id of mon.moves) {
    const o = opts.get(id)
    const name = ctx.gen.moves[id]?.name ?? id
    if (!o)
      issues.push({
        level: 'error',
        message: `${name} can't be learned in this game.`,
      })
    else if (!o.available)
      issues.push({ level: 'error', message: `${name}: ${o.reason}.` })
  }
  return issues
}
