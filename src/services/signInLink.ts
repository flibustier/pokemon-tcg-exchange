declare global {
  interface Window {
    signInLink?: string
  }
}

const KEY = 'signInLink'

// The email address and the token of the sign-in link the page was opened with: the script in the
// <head> (BaseLayout.astro) put them aside. They stay until the player is signed in or refused, as
// the page can reload before that (a newer build, a lost connection).
export const getSignInLink = () => {
  let link = window.signInLink
  try {
    link ??= sessionStorage.getItem(KEY) ?? undefined
  } catch {
    // no storage: the link is in the window only
  }
  const params = new URLSearchParams(link)
  return { email: params.get('email'), token: params.get('token') }
}

export const forgetSignInLink = () => {
  delete window.signInLink
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // nothing was stored
  }
}
