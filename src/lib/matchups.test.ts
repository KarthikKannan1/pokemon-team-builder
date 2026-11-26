import { describe, expect, it } from 'vitest'
import {
  attackerStyle,
  defenseMultiplier,
  effectiveCategory,
  teamCoverage,
  teamDefense,
  type TypeChart,
} from './matchups'
import type { GenMove } from './types'

// a tiny hand-made chart: defending → attacking → multiplier
const chart: TypeChart = {
  Water: { Electric: 2, Grass: 2, Water: 0.5, Fire: 0.5 },
  Fire: { Water: 2, Fire: 0.5 },
  Grass: { Fire: 2, Water: 0.5, Electric: 0.5 },
  Electric: { Ground: 2, Electric: 0.5 },
  Ground: { Water: 2, Grass: 2, Electric: 0 },
  Flying: { Electric: 2, Ground: 0, Grass: 0.5 },
  Dark: {},
}
const mv = (
  type: string,
  category: GenMove['category'],
  power: number | null = 80,
): GenMove => ({
  name: type,
  type,
  category,
  power,
  accuracy: 100,
  pp: 10,
  priority: 0,
  desc: '',
})

describe('matchups', () => {
  it('multiplies both types (Gyarados takes ×4 from Electric)', () => {
    expect(defenseMultiplier(chart, ['Water', 'Flying'], 'Electric')).toBe(4)
  })

  it('immunity wins (Ground/Flying vs Electric = 0)', () => {
    expect(defenseMultiplier(chart, ['Ground', 'Flying'], 'Electric')).toBe(0)
  })

  it('abilities: Levitate is immune to Ground; Lightning Rod only from Gen 5', () => {
    expect(defenseMultiplier(chart, ['Electric'], 'Ground', 'Levitate')).toBe(0)
    expect(
      defenseMultiplier(chart, ['Water'], 'Electric', 'Lightning Rod', 4),
    ).toBe(2)
    expect(
      defenseMultiplier(chart, ['Water'], 'Electric', 'Lightning Rod', 5),
    ).toBe(0)
  })

  it('flags a shared weakness', () => {
    const water = { name: 'W', types: ['Water'], ability: '', moves: [] }
    const rows = teamDefense(chart, [water, water, water], 9)
    expect(rows.find((r) => r.type === 'Electric')).toMatchObject({
      weak: 3,
      resist: 0,
      danger: true,
    })
  })

  it('coverage counts super-effective damaging moves only', () => {
    const members = [
      { name: 'A', types: [], ability: '', moves: [mv('Water', 'Special')] },
      { name: 'B', types: [], ability: '', moves: [mv('Electric', 'Status')] },
    ]
    const fire = teamCoverage(chart, members).find((r) => r.type === 'Fire')
    expect(fire?.hitters).toBe(1)
  })

  it('before Gen 4 the type decides physical/special', () => {
    expect(effectiveCategory(mv('Dark', 'Physical'), 3)).toBe('Special')
    expect(effectiveCategory(mv('Dark', 'Physical'), 4)).toBe('Physical')
    expect(
      attackerStyle([mv('Fire', 'Physical'), mv('Water', 'Physical')], 3),
    ).toBe('Special')
  })
})
