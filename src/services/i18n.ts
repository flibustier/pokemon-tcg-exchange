import { ref, shallowRef } from 'vue'

import en from '@/locales/en.json'

import type { Card } from './cards'

// The texts of the app (src/locales). English is in the main bundle: the pages are pre-rendered in
// it, and the app falls back on it. Another language is downloaded before the first page shows, with
// the card names in that language.
//
// To add a language: its file in src/locales, the type check tells which texts are missing, then a
// line in LOCALES and in loaders below.

export type MessageKey = keyof typeof en
type Messages = Record<MessageKey, string>

export const LOCALES = { en: 'English', es: 'Español', fr: 'Français' } as const
export type Locale = keyof typeof LOCALES

type Texts = { messages: Messages; cardNames: Record<string, string> }

const english: Texts = { messages: en, cardNames: {} }

const loaders: Record<Locale, () => Promise<Texts>> = {
  en: async () => english,
  es: () => texts(import('@/locales/es.json'), import('virtual:card-names/es')),
  fr: () => texts(import('@/locales/fr.json'), import('virtual:card-names/fr')),
}

// Together: when both fail, the second error must not stay without a handler
const texts = async (
  ...files: [Promise<{ default: Messages }>, Promise<{ default: Record<string, string> }>]
): Promise<Texts> => {
  const [messages, cardNames] = await Promise.all(files)
  return { messages: messages.default, cardNames: cardNames.default }
}

const STORAGE_KEY = 'locale'

export const locale = ref<Locale>('en')
const current = shallowRef(english)

const isLocale = (value: unknown): value is Locale => Object.keys(LOCALES).includes(value as string)

const languageOf = (tag: string) => tag.split('-')[0].toLowerCase()

// The language picked with the switcher, the browser's first one that the app has otherwise
const preferredLocale = (): Locale => {
  try {
    const picked = localStorage.getItem(STORAGE_KEY)
    if (isLocale(picked)) return picked
  } catch {
    // Storage blocked: the app follows the browser
  }
  return navigator.languages.map(languageOf).find(isLocale) ?? 'en'
}

let requested: Locale = 'en'

const load = async (to: Locale) => {
  requested = to
  const loaded = await loaders[to]()
  // Another language was picked in the meantime
  if (requested !== to) return

  current.value = loaded
  locale.value = to
  document.documentElement.lang = to
}

// Resolves when the texts are there. If they cannot be loaded, the app starts in English.
export const startLocale = () =>
  load(preferredLocale()).catch((error) => console.error('Texts not loaded:', error))

// If the texts cannot be loaded, the error goes to errors.ts, which may reload the page: it then
// starts in the language picked, kept first.
export const setLocale = (to: Locale) => {
  try {
    localStorage.setItem(STORAGE_KEY, to)
  } catch {
    // Storage blocked: the language changes for this page only
  }
  return load(to)
}

// A text may have two forms, "{n} card | {n} cards": `n` picks the one to use, as the language does
const form = (text: string, n: string | number | undefined) => {
  const forms = text.split(' | ')
  if (forms.length === 1 || typeof n !== 'number') return forms[0]
  return new Intl.PluralRules(locale.value).select(n) === 'one' ? forms[0] : forms[1]
}

export const t = (key: MessageKey, params: Record<string, string | number> = {}) =>
  form(current.value.messages[key], params.n).replace(/\{(\w+)\}/g, (placeholder, name) =>
    String(params[name] ?? placeholder),
  )

const isMessageKey = (key: string): key is MessageKey => key in en

// What the server answers when it refuses something, in English. A text the app does not know is
// shown as it is, and an error that is not a text means that the server gave no answer.
export const serverText = (answer: unknown) => {
  if (typeof answer !== 'string') return t('server.unreachable')
  const key = `server.${answer.trim()}`
  return isMessageKey(key) ? t(key) : answer
}

export const rarityName = (rarity: string) => {
  const key = `rarity.${rarity}`
  return isMessageKey(key) ? t(key) : rarity
}

export const cardName = ({ id, name }: Pick<Card, 'id' | 'name'>) =>
  current.value.cardNames[id] ?? current.value.cardNames[name] ?? name

// Without case and accents: "evoli" finds "Évoli"
export const searchable = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()

// A card is found by the name shown and by its English one
export const searchableName = (card: Pick<Card, 'id' | 'name'>) =>
  searchable(`${cardName(card)}\n${card.name}`)

export type SetNames = { en: string; [language: string]: string | undefined }

export const setName = ({ name }: { name: SetNames }) => name[locale.value] ?? name.en

// Dates in the language of the texts, written as in the player's country when the browser tells it
export const dateLocale = () =>
  navigator.languages.find((tag) => languageOf(tag) === locale.value) ?? locale.value
