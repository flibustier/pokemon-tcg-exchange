import allCards from 'pokemon-tcg-pocket-database/dist/cards.json' assert { type: 'json' }
import sets from 'pokemon-tcg-pocket-database/dist/sets.json' with { type: 'json' }
import rarities from 'pokemon-tcg-pocket-database/dist/rarities.json' with { type: 'json' }

export const allSets = Object.values(sets)
  .flat()
  .map((set) => ({
    ...set,
    code: set.code.toUpperCase(),
  }))

export const cards = allCards.map((card) => ({
  ...card,
  set: card.set.toUpperCase(),
  id: card.set.toUpperCase() + '-' + card.number,
}))

export type Card = (typeof cards)[0]

export { rarities }
