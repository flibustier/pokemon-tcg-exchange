import {
  getClientID,
  getGivingCardsAsArray,
  getWantedCardsAsArray,
  setLogin,
  getCredentials,
} from './store'

const isProduction = import.meta.env.PROD

const endpoint = isProduction ? 'https://api.pokemon-tcg.exchange' : 'http://localhost:8090'

interface UserInfo {
  email: string
  password: string
  friendId: string
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
        wanted: getWantedCardsAsArray(),
        giving: getGivingCardsAsArray(),
        friend_id: user.friendId,
      }),
    })

    const result = await response.text()

    if (result === 'created' || result === 'updated') {
      await setLogin(user.email, user.password)

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
