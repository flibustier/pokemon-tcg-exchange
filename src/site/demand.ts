import type { Card } from '@/services/cards'

// How many players want and give each card: totals of the server (GET /demand), read when the site is
// built. Without them (the dev server, or no answer), the pages show no total.

type Totals = {
  cards: Record<string, [wanted: number, offered: number]>
  jokers: Record<string, number>
}

const url =
  process.env.DEMAND_URL ??
  (import.meta.env.PROD ? 'https://api.pokemon-tcg.exchange/demand' : undefined)

const read = async (): Promise<Totals | undefined> => {
  if (!url) return undefined
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    console.warn(`No totals on the pages of the sets: ${url}: ${error}`)
    return undefined
  }
}

const totals = await read()

export const hasTotals = totals !== undefined
export const totalsDate = new Date()

// Players who want the card, and players who give it: in their offers, or with a joker
export const demandOf = ({ id, set, rarity }: Card) => {
  const [wanted, offered] = totals?.cards[id] ?? [0, 0]
  return { wanted, offered: offered + (totals?.jokers[`${set}:${rarity}`] ?? 0) }
}
