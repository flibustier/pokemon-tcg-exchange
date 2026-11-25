import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import type { Plugin } from 'vite'

import config from '../config.json' with { type: 'json' }

// Without a BUGSINK_DSN in config.json, errors.ts never loads errors-sdk.js and nothing refers to it
// anymore, but Rolldown still writes it: leave it out.
export const errorsSdkOnlyWithDsn = (): Plugin => ({
  name: 'errors-sdk-only-with-dsn',
  apply: 'build',
  generateBundle(_options, bundle) {
    if (!config.BUGSINK_DSN) {
      delete bundle['assets/errors-sdk.js']
      delete bundle['assets/errors-sdk.js.map']
    }
  },
})

// `virtual:card-names/es`: the card names that differ from the English ones, by English name. Names
// repeat from a set to another, so this is a fraction of the file of the card database, which has
// every card. A card translated another way than its namesakes is there by its id.
const CARD_NAMES = 'virtual:card-names/'

export const cardNames = (): Plugin => {
  const require = createRequire(import.meta.url)
  const read = (file: string): { set: string; number: number; name: string }[] =>
    JSON.parse(readFileSync(require.resolve(`pokemon-tcg-pocket-database/dist/${file}`), 'utf8'))

  return {
    name: 'card-names',
    resolveId: (id) => (id.startsWith(CARD_NAMES) ? '\0' + id : undefined),
    load(id) {
      if (!id.startsWith('\0' + CARD_NAMES)) return
      const locale = id.slice(CARD_NAMES.length + 1)
      const translated = new Map(
        read(`cards.${locale}.no-image.min.json`).map((card) => [cardId(card), card.name]),
      )
      const names: Record<string, string> = {}
      const seen: Record<string, string> = {}
      for (const card of read('cards.no-image.min.json')) {
        const name = translated.get(cardId(card)) ?? card.name
        seen[card.name] ??= name
        if (name !== seen[card.name]) names[cardId(card)] = name
        else if (name !== card.name) names[card.name] = name
      }
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(names))})`
    },
  }
}

// As in src/services/cards.ts
const cardId = ({ set, number }: { set: string; number: number }) =>
  `${set.toUpperCase()}-${number}`
