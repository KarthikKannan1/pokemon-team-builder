const S =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

/** Pokémon HOME 3D render — every Pokémon, static. */
export const homeSprite = (id: number, shiny = false) =>
  `${S}/other/home/${shiny ? 'shiny/' : ''}${id}.png`
/** Small menu icon (up to Gen 8). */
export const iconSprite = (id: number) =>
  `${S}/versions/generation-viii/icons/${id}.png`
/** Animated (Showdown) sprite. */
export const animatedSprite = (id: number, shiny = false) =>
  `${S}/other/showdown/${shiny ? 'shiny/' : ''}${id}.gif`
