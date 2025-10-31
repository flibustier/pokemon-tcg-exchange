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
    setLogOut()

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

export const debouncedUpdateUser = debounce(() => updateUser(), 1000)
export const updateUser = async () => {
  if (!isLogged()) return

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

  if (result === 'updated') {
    return true
  } else {
    throw result
  }
}

export const getProposals = (): Promise<Proposal[]> => useAPI('/user/proposals')

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
