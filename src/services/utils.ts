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

export const formatDate = (date: string) => {
  // if it's today, return the time
  // if it's yesterday, return "Yesterday"
  // if it’s the same week, return the day of the week
  // if it’s the same year, return the day and the month
  // else return the full date

  const now = new Date()
  const messageDate = new Date(date + ' UTC')
  const diff = now.getTime() - messageDate.getTime()
  const diffDays = Math.floor(diff / (1000 * 3600 * 24))
  if (diffDays === 0) {
    return messageDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return messageDate.toLocaleDateString(undefined, { weekday: 'long' })
  } else if (now.getFullYear() === messageDate.getFullYear()) {
    return messageDate.toLocaleDateString(undefined, { day: '2-digit', month: 'long' })
  } else {
    return messageDate.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }
}
