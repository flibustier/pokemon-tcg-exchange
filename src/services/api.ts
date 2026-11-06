import { ref } from 'vue'

import type { Discussion, Message, Proposal } from '@/types'

import { debounce } from './utils'
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

// Each save sends the whole collection, so trying again cannot apply a change twice.
const saveCards = async () => {
  try {
    await updateUser()
    saveRetries = 0
  } catch (error) {
    console.error('Error:', error)

    if (!isAuthError(error) && saveRetries < MAX_SAVE_RETRIES) {
      saveRetries++
      retrySaveCards()
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

  try {
    const result = await useAPI(
      '/user/',
      'PUT',
      {
        ...getUserInfo(),
        wanted: getWantedCardsAsArray.value,
        giving: getGivingCardsAsArray.value,
      },
      false,
    )

    if (result !== 'updated') {
      throw result
    }

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
