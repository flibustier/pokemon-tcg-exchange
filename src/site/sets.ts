import { UNAUTHORIZED_SETS } from '@/../config.json' with { type: 'json' }
import { allSets, cards, rarities, type Card } from '@/services/cards'
import type { SetNames } from '@/services/i18n'
import type { Locale } from '@/services/texts'

// The sets whose cards can be traded, the latest first

export const isTradeable = (card: Card) =>
  rarities[card.rarity as keyof typeof rarities].tradeable && !UNAUTHORIZED_SETS.includes(card.set)

export const sets = allSets
  .filter(({ code }) => !code.startsWith('PROMO'))
  .map((set) => ({ ...set, cards: cards.filter((card) => card.set === set.code) }))
  .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate) || b.cards.length - a.cards.length)

export type SiteSet = (typeof sets)[number]

export const nameOf = (set: { name: SetNames }, locale: Locale) => set.name[locale] ?? set.name.en
