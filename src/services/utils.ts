export const uniq = <T>(array: Array<T | undefined | null>): T[] =>
  Array.from(new Set(array.filter((x): x is T => x !== undefined && x !== null && x !== '')))
