import { ref, watch, computed } from 'vue'
import { debouncedUpdateUser } from './api'
import { cards } from './cards'

enum ObjectName {
  ClientID = 'client_id',
  WantedCards = 'wanted_cards',
  GivingCards = 'giving_cards',
  LogIn = 'token',
  FriendId = 'friend_id',
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

export const setFriendId = (friendId: string) => {
  localStorage.setItem(ObjectName.FriendId, friendId)
}

export const getFriendId = () => {
  return localStorage.getItem(ObjectName.FriendId) || ''
}

export const getWantedCards = () => {
  return JSON.parse(localStorage.getItem(ObjectName.WantedCards) || '{}')
}
export const getGivingCards = () => {
  return JSON.parse(localStorage.getItem(ObjectName.GivingCards) || '{}')
}

export const wantedCardsCountById = ref<Record<string, number>>(getWantedCards())
export const givingCardsCountById = ref<Record<string, number>>(getGivingCards())

export const setWantedCards = (cards: Record<string, number>) => {
  localStorage.setItem(ObjectName.WantedCards, JSON.stringify(cards))
}
export const setGivingCards = (cards: Record<string, number>) => {
  localStorage.setItem(ObjectName.GivingCards, JSON.stringify(cards))
}

watch(
  wantedCardsCountById,
  (newStore) => {
    setWantedCards(newStore)
    debouncedUpdateUser()
  },
  { deep: true },
)
watch(
  givingCardsCountById,
  (newStore) => {
    setGivingCards(newStore)
    debouncedUpdateUser()
  },
  { deep: true },
)

export const isWantedStepCompleted = computed(() =>
  Object.values(wantedCardsCountById.value).some((value) => value > 0),
)
export const isGivingStepCompleted = computed(() =>
  Object.values(givingCardsCountById.value).some((value) => value > 0),
)

export const isAccountIncomplete = computed(
  () => !isWantedStepCompleted.value || !isGivingStepCompleted.value,
)

const getCardsAsArray = (cardsStore: Record<string, number>) => {
  return Object.entries(cardsStore)
    .map(([id, count]) => {
      const [set, numberString] = id.split('-')
      const number = parseInt(numberString)

      const additionalInformations = cards.find(
        (card) => card.set === set && card.number === number,
      )

      return {
        id,
        set,
        number,
        count,
        rarity: additionalInformations?.rarityCode,
        packs: additionalInformations?.packs,
      }
    })
    .filter((card) => card.count > 0)
}

export const getWantedCardsAsArray = computed(() => getCardsAsArray(wantedCardsCountById.value))
export const getGivingCardsAsArray = computed(() => getCardsAsArray(givingCardsCountById.value))

type Card = {
  id: string
  count: number
}
export const importCards = (wanted: Card[], giving: Card[]) => {
  wantedCardsCountById.value = wanted.reduce(
    (acc, card) => {
      acc[card.id] = card.count
      return acc
    },
    {} as Record<string, number>,
  )
  givingCardsCountById.value = giving.reduce(
    (acc, card) => {
      acc[card.id] = card.count
      return acc
    },
    {} as Record<string, number>,
  )
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

export const setLogOut = () => {
  localStorage.removeItem(ObjectName.LogIn)
  localStorage.removeItem(ObjectName.FriendId)
  localStorage.removeItem(ObjectName.WantedCards)
  localStorage.removeItem(ObjectName.GivingCards)
}

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
