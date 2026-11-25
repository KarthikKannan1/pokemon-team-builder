import type { PickGroup, PickOption } from './obtained'

export const GROUP_LABEL: Record<PickGroup, string> = {
  level: 'Level-up',
  tm: 'TM / HM / TR',
  tutor: 'Move tutor',
  egg: 'Egg moves',
  event: 'Event moves',
}

/** Short "how it's learned": "Lv 43", "TM25", "Tutor", "Egg", "Event" — plus "(as Dratini)" for pre-evolutions. */
export function sourceLabel(o: PickOption, speciesName?: string): string {
  const s = o.sources.find((x) => x.group === o.group) ?? o.sources[0]
  const how =
    s.group === 'level'
      ? `Lv ${s.level}`
      : s.group === 'tm'
        ? (s.label ?? 'TM')
        : s.group === 'tutor'
          ? 'Tutor'
          : s.group === 'egg'
            ? 'Egg'
            : 'Event'
  return speciesName && s.via !== speciesName ? `${how} (as ${s.via})` : how
}
