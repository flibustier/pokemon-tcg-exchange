<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { CLOSED_SETS } from '@/../config.json' with { type: 'json' }
import type { Proposal } from '@/types'

import { formatDate, uniq } from '@/services/utils'
import { cards, rarities, type Card } from '@/services/cards'
import { getProposals } from '@/services/api'
import { searchable, searchableName, t } from '@/services/i18n'
import { givingCardsCountById, isCoveredByJoker } from '@/services/store'

import CenteredLayout from '@/layouts/CenteredLayout.vue'
import RichText from '@/components/atoms/RichText'
import PlainButton from '@/components/atoms/PlainButton.vue'
import CardsFilters from '@/components/CardsFilters.vue'
import UserBadge from '@/components/atoms/UserBadge.vue'
import CardImageAndModal from '@/components/molecules/CardImageAndModal.vue'
import MessageIcon from '@/components/icons/MessageIcon.vue'

const route = useRoute()
const router = useRouter()

const error = ref()
const loading = ref(true)
const allProposals = ref([] as Proposal[])

const filters = ref({
  raritySelection: [] as string[],
  languageSelection: [] as string[],
  pseudonymSelection: [] as string[],
  cardName: undefined as string | undefined,
})

const data = computed(() => allProposals.value)

const cardsForFilters = computed(() => {
  return data.value.map((proposal) => proposal.card1)
})
const languages = computed(() => {
  return uniq(data.value.map((proposal) => proposal.language))
})
const pseudonyms = computed(() => {
  return uniq(data.value.map((proposal) => proposal.pseudo))
})

type ProposalGroup = {
  icon?: string
  pseudo?: string
  language?: string
  rarity: string
  closedSet: string
  friendID: string
  wantedCards: Card[]
  givenCards: Card[]
  lastUpdate: string
  lastSeen?: string
}

const cardContainsFilterTerms = (card: Card) =>
  searchableName(card).includes(searchable(filters.value.cardName || ''))

// Cards of a closed set (SP1) are only traded for cards of the same set, as the server matches
// them: they get their own group, so a tile never seems to trade one for a card of another set.
const closedSetOf = (card: Card) => (CLOSED_SETS.includes(card.set) ? card.set : '')

const proposalsByRarityAndFriendId = computed(() => {
  return data.value.reduce((acc: ProposalGroup[], proposal: Proposal): ProposalGroup[] => {
    const rarity = proposal.card1.rarity
    const closedSet = closedSetOf(proposal.card1)
    const {
      friend_id: friendID,
      icon,
      pseudo,
      language,
      other_user_date,
      other_last_seen,
    } = proposal

    if (
      (filters.value.raritySelection.length && !filters.value.raritySelection.includes(rarity)) ||
      (filters.value.languageSelection.length &&
        !filters.value.languageSelection.includes(language || '')) ||
      (filters.value.pseudonymSelection.length &&
        !filters.value.pseudonymSelection.includes(pseudo || '')) ||
      (filters.value.cardName &&
        !cardContainsFilterTerms(proposal.card1) &&
        !cardContainsFilterTerms(proposal.card2))
    ) {
      return acc
    }

    const existingGroup = acc.find(
      (group) =>
        group.rarity === rarity && group.closedSet === closedSet && group.friendID === friendID,
    )
    if (existingGroup) {
      if (existingGroup.wantedCards.every((card) => card.id !== proposal.card1.id)) {
        existingGroup.wantedCards.push(proposal.card1)
      }
      if (existingGroup.givenCards.every((card) => card.id !== proposal.card2.id)) {
        existingGroup.givenCards.push(proposal.card2)
      }
    } else {
      acc.push({
        rarity,
        closedSet,
        friendID,
        icon,
        pseudo,
        language,
        lastUpdate: formatDate(other_user_date),
        lastSeen: other_last_seen ? formatDate(other_last_seen) : undefined,
        wantedCards: [proposal.card1],
        givenCards: [proposal.card2],
      })
    }
    return acc
  }, [])
})

// How many copies I offer, or the joker that gives it
const countGivenCard = (card: Card) =>
  givingCardsCountById.value[card.id] || (isCoveredByJoker(card) ? '🃏' : 0)

const findCard = (id: string) => cards.find((card) => card.id === id)

const exchangeCost = (rarity: string) => rarities[rarity as keyof typeof rarities].tradePrice

const sendMessage = (proposal: ProposalGroup) => {
  router.push({
    name: 'message',
    params: { id: proposal.friendID },
    query: {
      i: proposal.icon,
      p: proposal.pseudo,
    },
  })
}

const reload = () => {
  window.location.reload()
}

const fetchProposals = async () => {
  loading.value = true
  try {
    const response = await getProposals(route.query.id as string | undefined)
    allProposals.value = response.map(
      (proposal: Proposal) =>
        ({
          ...proposal,
          card1: findCard(proposal.card_wanted),
          card2: findCard(proposal.card_to_give),
        }) as Proposal,
    )
  } catch (err) {
    error.value = err
  }

  loading.value = false
}

watch(() => route.query.id, fetchProposals)
onMounted(fetchProposals)
</script>

<template>
  <CenteredLayout>
    <h2 v-if="loading">{{ t('proposals.loading') }}</h2>
    <template v-else-if="error">
      <h2 style="margin-bottom: 2rem">{{ error }}</h2>
      <PlainButton @click="reload">{{ t('proposals.refresh') }}</PlainButton>
    </template>
    <template v-else-if="data.length > 0">
      <h2>{{ t('proposals.match') }}</h2>
      <CardsFilters
        v-model="filters"
        :cards="cardsForFilters"
        :languages="languages"
        :pseudonyms="pseudonyms"
      />

      <div class="list">
        <div
          class="exchange-tile"
          v-for="(group, index) in proposalsByRarityAndFriendId"
          :key="index"
        >
          <UserBadge class="tile-title" v-bind="group" />
          <div class="cards">
            <div class="card-container" v-for="(card, index) in group.wantedCards" :key="index">
              <CardImageAndModal :card />
            </div>
          </div>

          <div class="exchange-icon"></div>
          <div class="cards">
            <div class="card-container" v-for="(card, index) in group.givenCards" :key="index">
              <CardImageAndModal :card />
              <span class="card-count">{{ countGivenCard(card) }}</span>
            </div>
          </div>
          <div class="tile-footer">
            <div v-if="group.language">{{ group.language }}</div>
            <div>
              <img
                src="/images/shinedust.webp"
                :alt="t('app.shinedust')"
                class="trade-token"
                height="32"
              />
              <span class="token-count">{{ exchangeCost(group.rarity) }}</span>
            </div>
            <div class="clickable" @click="sendMessage(group)">
              <MessageIcon class="message-icon" role="img" :aria-label="t('proposals.message')" />
            </div>
          </div>
        </div>
      </div>
    </template>
    <h2 v-else><RichText text="proposals.none" /></h2>
  </CenteredLayout>
</template>

<style scoped>
.clickable:hover {
  cursor: pointer;
}

.list {
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
}

h2 {
  text-align: center;
  margin-bottom: 1rem;
}

.exchange-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 42px 32px 7px;
  background: linear-gradient(to bottom, var(--color-green-soft), var(--color-green-soft-hover));
  border-radius: 16px;
  box-shadow:
    0 1px 3px var(--shadow-color),
    0 0 0 1px var(--ring-color);
  max-width: 600px;
  min-width: 270px;
  margin-bottom: 1rem;
}

.cards {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 400px;
  overflow-x: scroll;
}

.card-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.card-count {
  position: relative;
  height: 25px;
  width: 30px;
  bottom: 25px;
  right: -53px;
  border-radius: 25% 0%;
  text-align: center;
  color: white;
  background: #666d;
}

.exchange-icon {
  width: 32px;
  height: 32px;
  background: var(--color-green-soft);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 1px 3px var(--shadow-color),
    0 0 0 1px var(--ring-color);
  margin: 1rem;
}

.exchange-icon::before {
  content: '⇅';
  color: var(--color-text-muted);
  font-size: 18px;
}

.tile-footer {
  position: absolute;
  top: 500px;
  transform: none;

  display: flex;
  justify-content: space-evenly;
  width: 270px;
}

.tile-footer > div {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  padding: 4px 16px;
  border-radius: 12px;
  box-shadow:
    0 1px 3px var(--shadow-color),
    0 0 0 1px var(--ring-color);
}

.tile-title {
  position: absolute;
  top: -18px;
  transform: none;
}

.trade-token {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.message-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text);
}

.token-count {
  color: var(--color-text-muted);
  font-weight: 500;
}
</style>
