import { DEFAULT_LOCALE, localePath, locales, type Locale } from '@/services/texts'

// The public pages, for the sitemap: those in one language, and those in every language
const SINGLE = ['/login']
const TRANSLATED = ['/', '/help']

type PublicPage = { address: string; alternates: { locale: Locale; address: string }[] }

export const publicPages: PublicPage[] = [
  ...SINGLE.map((address) => ({ address, alternates: [] })),
  ...TRANSLATED.flatMap((path) => {
    const alternates = locales.map((locale) => ({ locale, address: localePath(locale, path) }))
    return alternates.map(({ address }) => ({ address, alternates }))
  }),
]

export const defaultOf = ({ alternates }: PublicPage) =>
  alternates.find(({ locale }) => locale === DEFAULT_LOCALE)?.address
