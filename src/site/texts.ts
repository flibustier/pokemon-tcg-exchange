import type { MessageKey } from '@/services/i18n'
import appEn from '@/locales/en.json'
import appEs from '@/locales/es.json'
import appFr from '@/locales/fr.json'
import appIt from '@/locales/it.json'
import {
  DEFAULT_LOCALE,
  formatText,
  localePath,
  locales,
  LOCALES,
  type Locale,
  type Params,
} from '@/services/texts'
import en from '@/locales/site/en.json'
import es from '@/locales/site/es.json'
import fr from '@/locales/site/fr.json'
import it from '@/locales/site/it.json'

// The texts of the public pages, written in the HTML by Astro. They share those of the app for what
// both show (the header, the rarities…).

export type SiteTexts = typeof en

const SITE: Record<Locale, SiteTexts> = { en, es, fr, it }
const APP: Record<Locale, Record<MessageKey, string>> = {
  en: appEn,
  es: appEs,
  fr: appFr,
  it: appIt,
}

export const useTexts = (locale: Locale) => ({
  site: SITE[locale],
  app: (key: MessageKey, params?: Params) => formatText(locale, APP[locale][key], params),
})

// For getStaticPaths of the pages in src/pages/[...locale]: /help, /es/help, /fr/help
export const localizedPaths = () =>
  locales.map((locale) => ({
    params: { locale: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }))

// The same page in every language, for the switcher
export const alternatesOf = (path: string) =>
  locales.map((locale) => ({
    locale,
    name: LOCALES[locale],
    href: localePath(locale, path),
    hint: SITE[locale].hint,
  }))
