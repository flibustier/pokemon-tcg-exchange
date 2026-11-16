// The site follows the system's theme. The theme button picks the other one: that choice is kept
// in localStorage. Picking the system's theme again forgets the choice, so the site follows the
// system again, also when it changes later.
//
// The theme in use is set as `data-theme` on <html>, first by the script in index.html, before
// the first paint so the page never flashes in the wrong theme, then by this file.

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark'

const darkSystem = () => window.matchMedia('(prefers-color-scheme: dark)')

const systemTheme = (): Theme => (darkSystem().matches ? 'dark' : 'light')

const storedTheme = (): Theme | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isTheme(value) ? value : null
  } catch {
    // Storage blocked: the site follows the system
    return null
  }
}

export const currentTheme = (): Theme => storedTheme() ?? systemTheme()

const apply = (theme: Theme) => {
  const root = document.documentElement
  if (root.dataset.theme === theme) return

  // Without this class, the elements with a transition would fade one after the other
  root.classList.add('theme-switching')
  root.dataset.theme = theme
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')))
}

export const toggleTheme = () => {
  const shown = document.documentElement.dataset.theme
  const next: Theme = (isTheme(shown) ? shown : currentTheme()) === 'dark' ? 'light' : 'dark'
  try {
    if (next === systemTheme()) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, next)
    }
  } catch {
    // Storage blocked: the theme changes for this page only
  }
  apply(next)
}

// Follows the system when it changes (often at sunset), and a theme picked in another tab
export const watchTheme = () => {
  darkSystem().addEventListener('change', () => apply(currentTheme()))
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) apply(currentTheme())
  })
}
