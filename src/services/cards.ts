import allCards from 'pokemon-tcg-pocket-database/dist/cards.no-image.min.json' assert { type: 'json' }
import sets from 'pokemon-tcg-pocket-database/dist/sets.json' with { type: 'json' }
import rarities from 'pokemon-tcg-pocket-database/dist/rarities.json' with { type: 'json' }

export const allSets = Object.values(sets)
  .flat()
  .map((set) => ({
    ...set,
    code: set.code.toUpperCase(),
    imagePath: `/images/sets/LOGO_expansion_${set.code}_en_US.webp`
  }))

export const cards = allCards.map((card) => ({
  ...card,
  set: card.set.toUpperCase(),
  id: card.set.toUpperCase() + '-' + card.number,
  imagePaths: {
    thumbnail: `/images/cards-by-set/thumbnails/${card.set}/${card.number}.webp`,
    full: `/images/cards-by-set/${card.set}/${card.number}.webp`,
    set: `/images/sets/LOGO_expansion_${card.set}_en_US.webp`
  }
}))

export type Card = (typeof cards)[0]

export { rarities }
