/** Signature colour of each exact game version (keys match `Game.versions`). */
export const VERSION_COLORS: Record<string, string> = {
  red: '#e3350d',
  blue: '#1e5bd6',
  yellow: '#ffd733',
  gold: '#daa520',
  silver: '#c0c0c0',
  crystal: '#4fd9ff',
  ruby: '#a00000',
  sapphire: '#0000a0',
  emerald: '#00a000',
  firered: '#ff7327',
  leafgreen: '#00dd00',
  diamond: '#aaaaff',
  pearl: '#ffaaaa',
  platinum: '#999999',
  heartgold: '#b69e00',
  soulsilver: '#c0c0e1',
  black: '#444444',
  white: '#e1e1e1',
  'black-2': '#424b50',
  'white-2': '#e3ced0',
  x: '#025da6',
  y: '#ea1a3e',
  'omega-ruby': '#ab2813',
  'alpha-sapphire': '#26649c',
  sun: '#f1912b',
  moon: '#5599ca',
  'ultra-sun': '#e95b2b',
  'ultra-moon': '#226db5',
  'lets-go-pikachu': '#f5da26',
  'lets-go-eevee': '#d4924b',
  sword: '#00a1e9',
  shield: '#bf004f',
  'brilliant-diamond': '#44bae5',
  'shining-pearl': '#da7d99',
  scarlet: '#f34134',
  violet: '#8334b7',
}

/**
 * CSS background for a badge: one colour fills it, several split it
 * into equal diagonal slices (X / Y → blue | red).
 */
export function badgeBackground(colors: string[]): string {
  if (colors.length <= 1) return colors[0] ?? 'transparent'
  const step = 100 / colors.length
  const stops = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
  return `linear-gradient(135deg, ${stops.join(', ')})`
}
