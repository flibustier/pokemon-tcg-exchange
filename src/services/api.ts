import { ref } from 'vue'

import type { Discussion, Message, Proposal } from '@/types'

import { debounce } from './utils'
import { cardsById } from './cards'
import {
  getClientID,
  getGivingCardsAsArray,
  getWantedCardsAsArray,
  setLogin,
  importCards,
  isLogged,
  getUserInfo,
  setUserInfo,
  getBasicAuth,
  storeDiscussions,
  setLogOut,
  changeLoginEmail,
  wantedCardsCountById,
  givingCardsCountById,
  importJokers,
  jokers,
  jokerExclusions,
} from './store'

const isProduction = import.meta.env.PROD

// VITE_API_URL points the front at another server, like a branch running on another port
const endpoint =
  import.meta.env.VITE_API_URL ??
  (isProduction ? 'https://api.pokemon-tcg.exchange' : 'http://localhost:8090')

// Bodies of the server's 401 responses. Any other failure says nothing about the credentials.
const AUTH_ERRORS: unknown[] = [
  'invalid password',
  'insufficient credentials',
  'Authorization header not found',
]
const isAuthError = (error: unknown) => AUTH_ERRORS.includes(error)

const MAX_SAVE_RETRIES = 5
const SAVE_RETRY_DELAY = 10000
// Beyond this many changed cards, one save of the whole collection is cheaper.
const MAX_CARD_SAVES = 20

type Counts = Record<string, number>

// The collection as the server has it, so that a save sends only the cards that changed.
// Unknown until the session is loaded or the whole collection is saved.
let savedCards: { wanted: Counts; giving: Counts } | undefined

const copyCounts = (counts: Counts): Counts =>
  Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 0))

const rememberSavedCards = (wanted: Counts, giving: Counts) => {
  savedCards = { wanted: copyCounts(wanted), giving: copyCounts(giving) }
}

type Flags = Record<string, boolean>

// The jokers as the server has them. Until the session is loaded they are unknown, and the page
// shows no joker: there is no request to send them all at once.
let savedJokers: { jokers: Flags; exclusions: Flags } | undefined
export const areJokersLoaded = ref(false)

const rememberSavedJokers = () => {
  savedJokers = { jokers: { ...jokers.value }, exclusions: { ...jokerExclusions.value } }
  areJokersLoaded.value = true
}

// Keys whose flag differs between what the server has and what the page shows
const changedFlags = (saved: Flags, current: Flags) =>
  [...new Set([...Object.keys(saved), ...Object.keys(current)])]
    .map((key) => ({ key, on: current[key] === true }))
    .filter(({ key, on }) => on !== (saved[key] === true))

const MAX_JOKER_SETS = 100

export const saveFailed = ref(false)

const useAPI = async (
  route: string,
  method: string = 'GET',
  body?: unknown,
  isJsonResponse = true,
) => {
  try {
    const response = await fetch(endpoint + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + getBasicAuth(),
        'X-Client-ID': getClientID(),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (isJsonResponse && response.ok) {
      return await response.json()
    }

    return await response.text()
  } catch (error) {
    console.error('Error:', error)

    throw error
  }
}

export const fetchUser = async () => {
  try {
    const response = await useAPI('/user/session')

    if (response.friend_id) {
      const {
        wanted,
        giving,
        rarity_rules,
        jokers: playerJokers,
        joker_exclusions,
        ...info
      } = response

      importCards(JSON.parse(wanted), JSON.parse(giving))
      rememberSavedCards(wantedCardsCountById.value, givingCardsCountById.value)
      // A server older than the jokers sends none: the page then shows no joker
      if (playerJokers !== undefined) {
        importJokers(JSON.parse(playerJokers), JSON.parse(joker_exclusions))
        rememberSavedJokers()
      }
      setUserInfo({
        ...info,
        rarity_rules: JSON.parse(rarity_rules),
      })

      refreshDiscussions()

      return true
    } else {
      throw response
    }
  } catch (error) {
    console.error('Error:', error)

    if (isAuthError(error)) {
      setLogOut()
    }

    throw error
  }
}

export const createUser = async (user: { email: string; password: string; friendId: string }) => {
  try {
    const response = await fetch(endpoint + '/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: getClientID(),
        email: user.email,
        password: user.password,
        friend_id: user.friendId,
        wanted: getWantedCardsAsArray.value,
        giving: getGivingCardsAsArray.value,
      }),
    })

    const result = await response.text()

    if (result === 'created') {
      await setLogin(user.email, user.password)
      setUserInfo({
        friend_id: user.friendId,
        email: user.email,
        email_status: 'pending',
      })
      // A new account has no joker: they can be set right away
      importJokers([], [])
      rememberSavedJokers()

      return true
    } else {
      throw result
    }
  } catch (error) {
    console.error('Error:', error)

    throw error
  }
}

let saveRetries = 0
let isSaving = false
let saveRequested = false

type CardChange = { list: 'wanted' | 'giving'; id: string; count: number }

const cardChanges = (list: CardChange['list'], saved: Counts, current: Counts): CardChange[] => {
  const ids = new Set([...Object.keys(saved), ...Object.keys(current)])
  return [...ids]
    .map((id) => ({ list, id, count: Math.max(current[id] || 0, 0) }))
    .filter(({ id, count }) => count !== (saved[id] || 0))
}

// Saves the cards that changed since the last save, one request each, or the whole
// collection when there are many or when the server's copy is unknown.
const sendCardChanges = async () => {
  if (!isLogged()) return

  const changes = savedCards && [
    ...cardChanges('wanted', savedCards.wanted, wantedCardsCountById.value),
    ...cardChanges('giving', savedCards.giving, givingCardsCountById.value),
  ]
  if (!changes || changes.length > MAX_CARD_SAVES || changes.some(({ id }) => !cardsById.has(id))) {
    await updateUser()
    return
  }

  for (const { list, id, count } of changes) {
    const { rarity, set, number } = cardsById.get(id)!
    const result = await useAPI(
      list === 'wanted' ? '/user/wishlist' : '/user/offers',
      'PUT',
      { id, count, rarity, set, number },
      false,
    )
    if (result !== 'updated') {
      throw result
    }
    if (savedCards) {
      if (count > 0) savedCards[list][id] = count
      else delete savedCards[list][id]
    }
  }
}

// Saves the jokers turned on or off, one request per rarity and state: the shortcut for every set
// is one request. Then the cards taken out of a joker or put back, one request each.
const sendJokerChanges = async () => {
  if (!isLogged() || !savedJokers) return
  const saved = savedJokers

  const setsByChange = new Map<string, string[]>()
  for (const { key, on } of changedFlags(saved.jokers, jokers.value)) {
    const [set, rarity] = key.split(':')
    const change = `${rarity}:${on}`
    setsByChange.set(change, [...(setsByChange.get(change) ?? []), set])
  }
  for (const [change, sets] of setsByChange) {
    const [rarity, on] = change.split(':')
    const enabled = on === 'true'
    for (let i = 0; i < sets.length; i += MAX_JOKER_SETS) {
      const chunk = sets.slice(i, i + MAX_JOKER_SETS)
      const result = await useAPI('/user/jokers', 'PUT', { sets: chunk, rarity, enabled }, false)
      if (result !== 'updated') {
        throw result
      }
      for (const set of chunk) {
        if (enabled) saved.jokers[`${set}:${rarity}`] = true
        else delete saved.jokers[`${set}:${rarity}`]
      }
    }
  }

  for (const { key: id, on: excluded } of changedFlags(saved.exclusions, jokerExclusions.value)) {
    const result = await useAPI('/user/jokers/exclusions', 'PUT', { id, excluded }, false)
    if (result !== 'updated') {
      throw result
    }
    if (excluded) saved.exclusions[id] = true
    else delete saved.exclusions[id]
  }
}

// Saves send absolute counts and states, so trying again cannot apply a change twice. One save
// runs at a time: two crossing on the network could leave the older count last.
const saveCards = async () => {
  if (isSaving) {
    saveRequested = true
    return
  }
  isSaving = true
  let succeeded = false
  try {
    await sendCardChanges()
    await sendJokerChanges()
    saveRetries = 0
    saveFailed.value = false
    succeeded = true
  } catch (error) {
    console.error('Error:', error)
    saveFailed.value = true

    if (!isAuthError(error) && saveRetries < MAX_SAVE_RETRIES) {
      saveRetries++
      retrySaveCards()
    }
  } finally {
    isSaving = false
    // After a failure, the retry above covers the changes made in the meantime
    if (saveRequested && succeeded) {
      saveRequested = false
      saveCards()
    }
  }
}
const retrySaveCards = debounce(() => saveCards(), SAVE_RETRY_DELAY)

export const debouncedUpdateUser = debounce(() => {
  saveRetries = 0
  saveCards()
}, 1000)

export const updateUser = async () => {
  if (!isLogged()) return

  const wanted = getWantedCardsAsArray.value
  const giving = getGivingCardsAsArray.value

  try {
    const result = await useAPI(
      '/user/',
      'PUT',
      {
        ...getUserInfo(),
        wanted,
        giving,
      },
      false,
    )

    if (result !== 'updated') {
      throw result
    }

    rememberSavedCards(
      Object.fromEntries(wanted.map(({ id, count }) => [id, count])),
      Object.fromEntries(giving.map(({ id, count }) => [id, count])),
    )
    saveFailed.value = false

    return true
  } catch (error) {
    saveFailed.value = true

    throw error
  }
}

export const getProposals = (id?: string): Promise<Proposal[]> =>
  useAPI('/user/proposals' + (id ? `?id=${id}` : ''))

const getDiscussions = (): Promise<Discussion[]> => useAPI('/user/discussions')
export const refreshDiscussions = (): Promise<void> =>
  getDiscussions().then((discussions) => storeDiscussions(discussions))

export const getMessages = (friendID: string): Promise<Message[]> =>
  useAPI(`/user/messages/${friendID}`)

export const postMessage = (friendID: string, message: string) =>
  useAPI(
    '/user/messages',
    'PUT',
    {
      to: friendID,
      message,
    },
    false,
  )

export const sendMagicLink = (email: string, friend_id: string) =>
  useAPI(
    '/forgotten_password',
    'POST',
    {
      email,
      friend_id,
    },
    false,
  )

// Public: the confirmation mail is often opened on another device than the one signed in.
export const confirmEmail = async (token: string): Promise<string> => {
  const response = await fetch(endpoint + '/confirm_email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  return response.text()
}

// Reads only the email from the session: fetchUser would also replace the cards, and lose the
// changes not saved yet.
export const refreshEmailStatus = async () => {
  const { email, email_status } = await useAPI('/user/session')
  if (email_status) setUserInfo({ ...getUserInfo(), email, email_status })
}

export const resendConfirmationEmail = (): Promise<string> =>
  useAPI('/user/confirmation_email', 'POST', undefined, false)

// Only while the email is pending. The server sends a new confirmation mail to the new address.
export const changeEmail = async (email: string): Promise<string> => {
  const newEmail = email.trim().toLowerCase()
  const result = await useAPI('/user/email', 'PUT', { email: newEmail }, false)
  if (result === 'updated') {
    changeLoginEmail(newEmail)
    setUserInfo({ ...getUserInfo(), email: newEmail })
  }
  return result
}

export const deleteAccount = (): Promise<string> =>
  useAPI('/user/', 'DELETE', { confirm: 'DELETE' }, false)
