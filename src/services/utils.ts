export const uniq = <T>(array: Array<T | undefined | null>): T[] =>
  Array.from(new Set(array.filter((x): x is T => x !== undefined && x !== null && x !== '')))

export function debounce<T extends (...args: unknown[]) => void>(func: T, timeout = 1500) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, timeout)
  }
}

export const isEqual = (obj1: Record<string, number>, obj2: Record<string, number>): boolean => {
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) {
    return false
  }
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false
    }
  }
  return true
}
