import type { GenData, MonEntry, Pokemon } from './types'

export interface FormOption {
  id: string // MonEntry id of the form
  label: string // 'Base', 'Mega X'
  stone?: string // item id that unlocks it
}

const toID = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

/** Base form + every Mega form available through a held stone in this generation's items. */
export function itemForms(
  speciesId: string,
  gen: GenData,
  mons: Map<string, MonEntry>,
): FormOption[] {
  const entry = mons.get(speciesId)
  if (!entry) return []
  const base = mons.get(entry.baseSpecies) ?? entry
  const forms: FormOption[] = [{ id: base.id, label: 'Base' }]
  for (const [itemId, item] of Object.entries(gen.items)) {
    const target = item.megaStone?.[base.name] // { Charizard: 'Charizard-Mega-X' }
    if (!target) continue
    const form = mons.get(toID(target))
    if (form)
      forms.push({
        id: form.id,
        label: (form.forme ?? 'Mega').replace(/-/g, ' '),
        stone: itemId,
      })
  }
  return forms
}

/** Which form the Pokémon is in right now, given its held item. */
export function activeFormId(
  mon: Pick<Pokemon, 'species' | 'item'>,
  gen: GenData,
  mons: Map<string, MonEntry>,
): string {
  if (!mon.item || !gen.items[mon.item]?.megaStone) return mon.species
  return (
    itemForms(mon.species, gen, mons).find((f) => f.stone === mon.item)?.id ??
    mon.species
  )
}
