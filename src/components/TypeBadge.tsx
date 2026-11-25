const COLORS: Record<string, string> = {
  Normal: '#9a9a7a',
  Fire: '#ee7f30',
  Water: '#6890f0',
  Electric: '#e8b923',
  Grass: '#5fae3e',
  Ice: '#6cc4c4',
  Fighting: '#c03028',
  Poison: '#a040a0',
  Ground: '#c9a14a',
  Flying: '#9480e0',
  Psychic: '#f85888',
  Bug: '#98a820',
  Rock: '#b8a038',
  Ghost: '#705898',
  Dragon: '#6a3cf0',
  Dark: '#705848',
  Steel: '#9a9ab8',
  Fairy: '#e489a8',
  Stellar: '#40b5a5',
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
      style={{ background: COLORS[type] ?? '#666' }}
    >
      {type}
    </span>
  )
}
