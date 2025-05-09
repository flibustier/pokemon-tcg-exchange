import cards from 'pokemon-tcg-pocket-database/dist/cards.json' assert { type: 'json' }
import allSets from 'pokemon-tcg-pocket-database/dist/sets.json' with { type: 'json' }
import rarityLabels from 'pokemon-tcg-pocket-database/dist/rarity.json' with { type: 'json' }

export type Card = (typeof cards)[0]

export { cards, allSets, rarityLabels }
