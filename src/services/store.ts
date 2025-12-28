import { ref, watch, computed, reactive } from 'vue'

import type { Discussion } from '@/types'

import { debouncedUpdateUser } from './api'
import { cards } from './cards'
import { isEqual } from './utils'

const storage = import.meta.env.SSR
  ? {
      getItem: () => {},
      setItem: () => {},
      removeItem: () => {},
    }
  : localStorage

enum ObjectName {
  ClientID = 'client_id',
  WantedCards = 'wanted_cards',
  GivingCards = 'giving_cards',
  LogIn = 'token',
  User = 'user',
}

const sessionStorage = reactive({
  discussions: [] as Discussion[],
})

export const hasUnreadMessages = computed(() =>
  sessionStorage.discussions.some(({ read }) => read === false),
)

export const discussions = computed(() => sessionStorage.discussions)

export const storeDiscussions = (discussions: Discussion[]) => {
  sessionStorage.discussions = discussions
}

export const getClientID = () => {
  let clientID = storage.getItem(ObjectName.ClientID)
  if (clientID) {
    return clientID
  }

  try {
    clientID = crypto.randomUUID()
  } catch {
    clientID = Math.random().toString(16).substring(2, 15)
  }
  storage.setItem(ObjectName.ClientID, clientID)

  return clientID
}

export const getUserInfo = (): User => {
  return JSON.parse(storage.getItem(ObjectName.User) || '{}')
}

export type RarityRule = {
  rarity: string
  enabled: 1 | 0
}

type User = {
  friend_id: string
  pseudo?: string
  icon?: string
  language?: string
  rarity_rules?: RarityRule[]
  github_username?: string
  has_beta_access?: boolean
}

export const setUserInfo = (user: User) => {
  storage.setItem(
    ObjectName.User,
    JSON.stringify({
      ...getUserInfo(),
      ...user,
    }),
  )
}

export const getWantedCards = () => {
  return JSON.parse(storage.getItem(ObjectName.WantedCards) || '{}')
}
export const getGivingCards = () => {
  return JSON.parse(storage.getItem(ObjectName.GivingCards) || '{}')
}

export const wantedCardsCountById = ref<Record<string, number>>(getWantedCards())
export const givingCardsCountById = ref<Record<string, number>>(getGivingCards())

export const setWantedCards = (cards: Record<string, number>) => {
  storage.setItem(ObjectName.WantedCards, JSON.stringify(cards))
}
export const setGivingCards = (cards: Record<string, number>) => {
  storage.setItem(ObjectName.GivingCards, JSON.stringify(cards))
}

watch(
  () => wantedCardsCountById.value,
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
        rarity: additionalInformations?.rarity,
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

const formatCardList = (cards: Card[]) =>
  cards.reduce(
    (acc, card) => {
      acc[card.id] = card.count
      return acc
    },
    {} as Record<string, number>,
  )

export const importCards = (wanted: Card[], giving: Card[]) => {
  const newWanted = formatCardList(wanted)
  if (!isEqual(wantedCardsCountById.value, newWanted)) {
    wantedCardsCountById.value = newWanted
  }

  const newGiving = formatCardList(giving)
  if (!isEqual(givingCardsCountById.value, newGiving)) {
    givingCardsCountById.value = newGiving
  }
}

async function passwordToSha512(password: string) {
  const msgUint8 = new TextEncoder().encode(password)
  const hashBuffer = await window.crypto.subtle.digest('SHA-512', msgUint8)

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const setLogin = async (email: string, password: string, hashedPassword?: string) => {
  if (!hashedPassword) {
    hashedPassword = await passwordToSha512(password)
  }

  storage.setItem(ObjectName.LogIn, btoa(email + ':' + hashedPassword))
}

export const setLogOut = () => {
  storage.removeItem(ObjectName.LogIn)
  storage.removeItem(ObjectName.WantedCards)
  storage.removeItem(ObjectName.GivingCards)
  storage.removeItem(ObjectName.User)
}

export const getBasicAuth = (): string => {
  return storage.getItem(ObjectName.LogIn) || ''
}
export const isLogged = () => storage.getItem(ObjectName.LogIn) != null
