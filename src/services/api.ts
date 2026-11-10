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
  wantedCardsCountById,
  givingCardsCountById,
} from './store'

const isProduction = import.meta.env.PROD

const endpoint = isProduction ? 'https://api.pokemon-tcg.exchange' : 'http://localhost:8090'

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
      const { wanted, giving, rarity_rules, ...info } = response

      importCards(JSON.parse(wanted), JSON.parse(giving))
      rememberSavedCards(wantedCardsCountById.value, givingCardsCountById.value)
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
      })

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

// Saves send absolute counts, so trying again cannot apply a change twice. One save runs at a
// time: two crossing on the network could leave the older count last.
const saveCards = async () => {
  if (isSaving) {
    saveRequested = true
    return
  }
  isSaving = true
  let succeeded = false
  try {
    await sendCardChanges()
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
