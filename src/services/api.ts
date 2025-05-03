import {
  getClientID,
  getGivingCardsAsArray,
  getWantedCardsAsArray,
  setLogin,
  getCredentials,
  importCards,
  setFriendId,
} from './store'

const isProduction = import.meta.env.PROD

const endpoint = isProduction ? 'https://api.pokemon-tcg.exchange' : 'http://localhost:8090'

interface UserInfo {
  email: string
  password: string
  friendId: string
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
      const { friend_id, wanted, giving } = await response.json()

      await setLogin(user.email, user.password)
      importCards(JSON.parse(wanted), JSON.parse(giving))
      setFriendId(friend_id)

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
      setFriendId(user.friendId)

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
