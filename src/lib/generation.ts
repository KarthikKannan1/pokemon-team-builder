/** First National Dex number of each generation (Gen 1 starts at #1, Gen 2 at #152…). */
const GEN_STARTS = [1, 152, 252, 387, 494, 650, 722, 810, 906]

/** Which generation a species was introduced in, from its National Dex number. */
export function speciesGen(num: number): number {
  let gen = 1
  GEN_STARTS.forEach((start, i) => {
    if (num >= start) gen = i + 1
  })
  return gen
}
