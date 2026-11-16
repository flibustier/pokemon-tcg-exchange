import { ref, watch, computed, reactive } from 'vue'

import type { Discussion } from '@/types'

import { debouncedUpdateUser } from './api'
import { cardsById } from './cards'
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
  Jokers = 'jokers',
  JokerExclusions = 'joker_exclusions',
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

export type RarityRule = {
  rarity: string
  enabled: 1 | 0
}

// 'legacy': signed up before emails were confirmed, nothing to do. 'pending': a new player
// who hasn't opened their confirmation mail yet, no notifications nor messages until then.
export type EmailStatus = 'legacy' | 'pending' | 'verified'

type User = {
  friend_id: string
  email?: string
  email_status?: EmailStatus
  pseudo?: string
  icon?: string
  language?: string
  rarity_rules?: RarityRule[]
  github_username?: string
  has_beta_access?: boolean
}

export const getUserInfo = (): User => {
  return JSON.parse(storage.getItem(ObjectName.User) || '{}')
}

export const userInfo = ref<User>(getUserInfo())

export const setUserInfo = (user: User) => {
  userInfo.value = {
    ...getUserInfo(),
    ...user,
  }
  storage.setItem(ObjectName.User, JSON.stringify(userInfo.value))
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

// A joker gives every card of a rarity in a set, except the cards the player wants, lists with a
// count, or excluded from it. Keyed by 'A1:C', and by card id for the exclusions. Each card reads
// its own key, so changing one re-renders only the cards concerned.
export const JOKER_RARITIES = ['C', 'U', 'R', 'RR']
export const jokerKey = (set: string, rarity: string) => `${set}:${rarity}`

const readFlags = (name: ObjectName): Record<string, boolean> =>
  JSON.parse(storage.getItem(name) || '{}')

export const jokers = ref<Record<string, boolean>>(readFlags(ObjectName.Jokers))
export const jokerExclusions = ref<Record<string, boolean>>(readFlags(ObjectName.JokerExclusions))

watch(
  jokers,
  (newJokers) => {
    storage.setItem(ObjectName.Jokers, JSON.stringify(newJokers))
    debouncedUpdateUser()
  },
  { deep: true },
)
watch(
  jokerExclusions,
  (newExclusions) => {
    storage.setItem(ObjectName.JokerExclusions, JSON.stringify(newExclusions))
    debouncedUpdateUser()
  },
  { deep: true },
)

export const isCoveredByJoker = (card: { id: string; set: string; rarity: string }) =>
  jokers.value[jokerKey(card.set, card.rarity)] === true &&
  !(wantedCardsCountById.value[card.id] > 0) &&
  !(givingCardsCountById.value[card.id] > 0) &&
  !jokerExclusions.value[card.id]

const asFlags = (keys: string[]) => Object.fromEntries(keys.map((key) => [key, true]))

export const importJokers = (
  serverJokers: { set: string; rarity: string }[],
  exclusions: string[],
) => {
  const newJokers = asFlags(serverJokers.map(({ set, rarity }) => jokerKey(set, rarity)))
  if (!isEqual(jokers.value, newJokers)) {
    jokers.value = newJokers
  }
  const newExclusions = asFlags(exclusions)
  if (!isEqual(jokerExclusions.value, newExclusions)) {
    jokerExclusions.value = newExclusions
  }
}

export const isWantedStepCompleted = computed(() =>
  Object.values(wantedCardsCountById.value).some((value) => value > 0),
)
export const isGivingStepCompleted = computed(
  () =>
    Object.values(givingCardsCountById.value).some((value) => value > 0) ||
    Object.keys(jokers.value).length > 0,
)

export const isCardsIncomplete = computed(
  () => !isWantedStepCompleted.value || !isGivingStepCompleted.value,
)

export const isEmailPending = computed(() => userInfo.value.email_status === 'pending')

export const isAccountIncomplete = computed(() => {
  const { pseudo, icon, language } = userInfo.value

  return (
    !pseudo ||
    pseudo.length === 0 ||
    !icon ||
    icon.length === 0 ||
    !language ||
    language.length === 0
  )
})

const getCardsAsArray = (cardsStore: Record<string, number>) => {
  return Object.entries(cardsStore)
    .map(([id, count]) => {
      const [set, numberString] = id.split('-')
      const number = parseInt(numberString)

      const additionalInformations = cardsById.get(id)

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

// The email is the login: after a change of email, sign in with the new one and the same password.
export const changeLoginEmail = (email: string) => {
  const login = atob(getBasicAuth())
  const hashedPassword = login.slice(login.indexOf(':') + 1)
  storage.setItem(ObjectName.LogIn, btoa(email + ':' + hashedPassword))
}

export const setLogOut = () => {
  storage.removeItem(ObjectName.LogIn)
  storage.removeItem(ObjectName.WantedCards)
  storage.removeItem(ObjectName.GivingCards)
  storage.removeItem(ObjectName.Jokers)
  storage.removeItem(ObjectName.JokerExclusions)
  storage.removeItem(ObjectName.User)
}

export const getBasicAuth = (): string => {
  return storage.getItem(ObjectName.LogIn) || ''
}
export const isLogged = () => storage.getItem(ObjectName.LogIn) != null
