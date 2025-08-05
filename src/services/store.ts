import { ref, watch, computed, reactive } from 'vue'
import { debouncedUpdateUser, type Discussion } from './api'
import { cards } from './cards'

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
  FriendId = 'friend_id',
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

export const getFriendId = () => {
  return getUserInfo().friend_id || storage.getItem(ObjectName.FriendId) || ''
}
export const setFriendId = (friendId: string) => {
  storage.setItem(ObjectName.FriendId, friendId)
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

export const setLogin = async (email: string, password: string, hashedPassword?: string) => {
  if (!hashedPassword) {
    hashedPassword = await passwordToSha512(password)
  }

  storage.setItem(ObjectName.LogIn, btoa(email + ':' + hashedPassword))
}

export const setLogOut = () => {
  storage.removeItem(ObjectName.LogIn)
  storage.removeItem(ObjectName.FriendId)
  storage.removeItem(ObjectName.WantedCards)
  storage.removeItem(ObjectName.GivingCards)
  storage.removeItem(ObjectName.User)
}

export interface Credentials {
  email: string
  password: string
}
export const getCredentials = (): Credentials => {
  const info = storage.getItem(ObjectName.LogIn)
  if (info) {
    const credentials = atob(info)
    const email = credentials.substring(0, credentials.indexOf(':'))
    const password = credentials.substring(credentials.indexOf(':') + 1)

    return { email, password }
  }

  return { email: '', password: '' }
}
export const getBasicAuth = (): string => {
  return storage.getItem(ObjectName.LogIn) || ''
}
export const isLogged = () => storage.getItem(ObjectName.LogIn) != null
