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

interface UserInfo {
  email: string
  password: string
  friendId: string
  pseudo?: string
  icon?: string
}

export const fetchUser = async (user: UserInfo) => {
  try {
    const response = await fetch(endpoint + '/user/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: getClientID(),
        email: user.email,
        password: user.password,
      }),
    })
    if (response.ok) {
      const { wanted, giving, ...info } = await response.json()

      await setLogin(user.email, user.password)
      importCards(JSON.parse(wanted), JSON.parse(giving))
      setUserInfo(info)

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
