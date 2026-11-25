// What the app (i18n.ts) and the pages built by Astro (src/site) share about the texts. Nothing here
// needs a browser.

export const LOCALES = { en: 'English', es: 'Español', fr: 'Français', it: 'Italiano' } as const
export type Locale = keyof typeof LOCALES

export const DEFAULT_LOCALE: Locale = 'en'
export const locales = Object.keys(LOCALES) as Locale[]

export const isLocale = (value: unknown): value is Locale => locales.includes(value as Locale)

// The language of a tag like "fr-CA"
export const languageOf = (tag: string) => tag.split('-')[0].toLowerCase()

// Where the browser keeps the language picked with the switcher
export const LOCALE_KEY = 'locale'

// The address of a public page in a language: /help, /fr/help
export const localePath = (locale: Locale, path: string) =>
  locale === DEFAULT_LOCALE ? path : `/${locale}${path}`

export type Params = Record<string, string | number>

// A text may have two forms, "{n} card | {n} cards": `n` picks the one to use, as the language does
const form = (locale: Locale, text: string, n: Params[string] | undefined) => {
  const forms = text.split(' | ')
  if (forms.length === 1 || typeof n !== 'number') return forms[0]
  return new Intl.PluralRules(locale).select(n) === 'one' ? forms[0] : forms[1]
}

export const formatText = (locale: Locale, text: string, params: Params = {}) =>
  form(locale, text, params.n).replace(/\{(\w+)\}/g, (placeholder, name) =>
    String(params[name] ?? placeholder),
  )

// A text with tags: <strong>, <b> and <br/> are HTML, what another one becomes is up to the page
export const HTML_TAGS = ['strong', 'b', 'br']

export type TextPart = string | { tag: string; text: string }

const TAG = /<(\w+)(?:\/>|>(.*?)<\/\1>)/g

export const parseTags = (text: string): TextPart[] => {
  const parts: TextPart[] = []
  let end = 0
  for (const match of text.matchAll(TAG)) {
    const [whole, tag, inside = ''] = match
    parts.push(text.slice(end, match.index), { tag, text: inside })
    end = match.index + whole.length
  }
  return [...parts, text.slice(end)].filter((part) => part !== '')
}
