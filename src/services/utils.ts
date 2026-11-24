import { dateLocale, t } from './i18n'

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

export const isEqual = <T>(obj1: Record<string, T>, obj2: Record<string, T>): boolean => {
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

// The server's dates are in UTC, like "2026-11-20 10:00:00". Safari reads no other format than ISO
// with certainty: "2026-11-20 10:00:00 UTC" is an invalid date there.
const parseDate = (date: string) =>
  new Date(date.includes('T') ? date : date.replace(' ', 'T') + 'Z')

export const formatDate = (date: string) => {
  // if it's today, return the time
  // if it's yesterday, return "Yesterday"
  // if it’s the same week, return the day of the week
  // if it’s the same year, return the day and the month
  // else return the full date

  const now = new Date()
  const messageDate = parseDate(date)
  const diff = now.getTime() - messageDate.getTime()
  const diffDays = Math.floor(diff / (1000 * 3600 * 24))
  if (diffDays === 0) {
    return messageDate.toLocaleTimeString(dateLocale(), { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return t('date.yesterday')
  } else if (diffDays < 7) {
    return messageDate.toLocaleDateString(dateLocale(), { weekday: 'long' })
  } else if (now.getFullYear() === messageDate.getFullYear()) {
    return messageDate.toLocaleDateString(dateLocale(), { day: '2-digit', month: 'long' })
  } else {
    return messageDate.toLocaleDateString(dateLocale(), {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }
}

export const formatFriendID = (friendID: string) =>
  friendID.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')

// Same content as the in-game "Add Friend" QR code: the dashed ID, twice, comma separated
export const friendQRPayload = (friendID: string) => {
  const formatted = formatFriendID(friendID)
  return `${formatted},${formatted}`
}
