import logos from 'virtual:set-logos'

import type { Card } from './cards'
import type { Locale } from './texts'

// The logo of a set in a language, the English one when it has no other
export const logoOf = ({ code, imagePath }: { code: string; imagePath: string }, locale: Locale) =>
  logos[locale]?.[code] ?? imagePath

export const logoOfCard = ({ set, imagePaths }: Pick<Card, 'set' | 'imagePaths'>, locale: Locale) =>
  logoOf({ code: set, imagePath: imagePaths.set }, locale)
