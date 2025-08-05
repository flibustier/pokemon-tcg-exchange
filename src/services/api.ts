import {
  getClientID,
  getGivingCardsAsArray,
  getWantedCardsAsArray,
  setLogin,
  getCredentials,
  importCards,
  getFriendId,
  isLogged,
  getUserInfo,
  setUserInfo,
  type Credentials,
  getBasicAuth,
  storeDiscussions,
} from './store'

function debounce<T extends (...args: unknown[]) => void>(func: T, timeout = 300) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func(...args)
    }, timeout)
  }
}

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
    if (isJsonResponse) {
      return await response.json()
    }

    return await response.text()
  } catch (error) {
    console.error('Error:', error)

    throw error
  }
}

interface UserInfo {
  email: string
  password: string
  friendId: string
  pseudo?: string
  icon?: string
}

export const fetchUser = async ({ email, password }: Credentials = getCredentials()) => {
  try {
    const response = await fetch(endpoint + '/user/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: getClientID(),
        email,
        password,
      }),
    })
    if (response.ok) {
      const { wanted, giving, rarity_rules, ...info } = await response.json()

      importCards(JSON.parse(wanted), JSON.parse(giving))
      setUserInfo({
        ...info,
        rarity_rules: JSON.parse(rarity_rules),
      })

      refreshDiscussions()

      return true
    } else {
      throw await response.text()
    }
  } catch (error) {
    console.error('Error:', error)

    throw error
  }
}

export const createUser = async (user: UserInfo) => {
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
        wanted: getWantedCardsAsArray.value,
        giving: getGivingCardsAsArray.value,
        friend_id: user.friendId,
      }),
    })

    const result = await response.text()

    if (result === 'created' || result === 'updated') {
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
  try {
    const response = await fetch(endpoint + '/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: getClientID(),
        ...getCredentials(),
        wanted: getWantedCardsAsArray.value,
        giving: getGivingCardsAsArray.value,
        ...getUserInfo(),
        friend_id: getFriendId(),
      }),
    })

    const result = await response.text()

    if (result === 'updated') {
      return true
    } else {
      throw result
    }
  } catch (error) {
    console.error('Error:', error)

    throw error
  }
}

export const getProposals = async () => {
  try {
    const response = await fetch(endpoint + '/user/proposals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: getClientID(),
        ...getCredentials(),
      }),
    })
    const result = await response.json()

    return result
  } catch (error) {
    console.error('Error:', error)

    throw error
  }
}

export interface Discussion {
  pseudo: string
  avatar: string
  language: string
  friend_id: string
  last_message: string
  last_message_date: string
  read: boolean
}

const getDiscussions = (): Promise<Discussion[]> => useAPI('/user/discussions')
export const refreshDiscussions = (): Promise<void> =>
  getDiscussions().then((discussions) => storeDiscussions(discussions))

export interface Message {
  from: string
  to: string
  message: string
  sent: string
  read: string | null
}
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
