import cards from 'pokemon-tcg-pocket-database/dist/cards.json' assert { type: 'json' }

enum ObjectName {
  ClientID = 'client_id',
  WantedCards = 'wanted_cards',
  GivingCards = 'giving_cards',
  LogIn = 'token',
}

export const getClientID = () => {
  let clientID = localStorage.getItem(ObjectName.ClientID)
  if (clientID) {
    return clientID
  }

  try {
    clientID = crypto.randomUUID()
  } catch {
    clientID = Math.random().toString(16).substring(2, 15)
  }
  localStorage.setItem(ObjectName.ClientID, clientID)

  return clientID
}

export const getWantedCards = () => {
  return JSON.parse(localStorage.getItem(ObjectName.WantedCards) || '{}')
}
export const getGivingCards = () => {
  return JSON.parse(localStorage.getItem(ObjectName.GivingCards) || '{}')
}

export const setWantedCards = (cards: Record<string, number>) => {
  localStorage.setItem(ObjectName.WantedCards, JSON.stringify(cards))
}
export const setGivingCards = (cards: Record<string, number>) => {
  localStorage.setItem(ObjectName.GivingCards, JSON.stringify(cards))
}

const getCardsAsArray = (cardsStore: Record<string, number>) => {
  return Object.entries(cardsStore).map(([id, count]) => {
    const [set, number] = id.split('-')

    return {
      id,
      set,
      number: parseInt(number),
      count,
      rarity: cards.find((card) => card.set === set && card.number === number)?.rarityCode,
    }
  })
}

export const getWantedCardsAsArray = () => {
  return getCardsAsArray(getWantedCards())
}
export const getGivingCardsAsArray = () => {
  return getCardsAsArray(getGivingCards())
}

async function passwordToSha512(password: string) {
  const msgUint8 = new TextEncoder().encode(password)
  const hashBuffer = await window.crypto.subtle.digest('SHA-512', msgUint8)

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const setLogin = async (email: string, password: string) => {
  const hashedPassword = await passwordToSha512(password)

  localStorage.setItem(ObjectName.LogIn, btoa(email + ':' + hashedPassword))
}

export const setLogOut = () => localStorage.removeItem(ObjectName.LogIn)

interface Credentials {
  email: string
  password: string
}
export const getCredentials = (): Credentials => {
  const info = localStorage.getItem(ObjectName.LogIn)
  if (info) {
    const credentials = atob(info)
    const email = credentials.substring(0, credentials.indexOf(':'))
    const password = credentials.substring(credentials.indexOf(':') + 1)

    return { email, password }
  }

  return { email: '', password: '' }
}
export const isLogged = () => localStorage.getItem(ObjectName.LogIn) != null
