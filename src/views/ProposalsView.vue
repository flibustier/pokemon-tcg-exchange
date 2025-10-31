<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { Proposal, ProposalCard } from '@/types'

import { uniq } from '@/services/utils'
import { cards } from '@/services/cards'
import { getProposals } from '@/services/api'
import { givingCardsCountById } from '@/services/store'

import CenteredLayout from '@/layouts/CenteredLayout.vue'
import PlainButton from '@/components/atoms/PlainButton.vue'
import CardsFilters from '@/components/CardsFilters.vue'
import UserBadge from '@/components/atoms/UserBadge.vue'

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

const data = computed(() =>
  allProposals.value.filter((proposal: Proposal) =>
    route.query.id ? proposal.friend_id === route.query.id : true,
  ),
)

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
  friendID: string
  wantedCards: ProposalCard[]
  givenCards: ProposalCard[]
}

const cardContainsFilterTerms = (card: ProposalCard) =>
  card.label.eng.toLowerCase().includes((filters.value.cardName || '').toLowerCase())

const proposalsByRarityAndFriendId = computed(() => {
  return data.value.reduce((acc: ProposalGroup[], proposal: Proposal): ProposalGroup[] => {
    const rarity = proposal.card1.rarityCode
    const { friend_id: friendID, icon, pseudo, language } = proposal

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
      (group) => group.rarity === rarity && group.friendID === friendID,
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
        friendID,
        icon,
        pseudo,
        language,
        wantedCards: [proposal.card1],
        givenCards: [proposal.card2],
      })
    }
    return acc
  }, [])
})

const countGivenCard = (cardId: string) => givingCardsCountById.value[cardId] || 0

const findCard = (id: string) => {
  const [set, number] = id.split('-')
  return {
    id,
    ...cards.find((card) => card.set === set && card.number === parseInt(number)),
  }
}

const exchangeTokenCost = (rarity: string) => {
  switch (rarity) {
    case 'R':
      return 1200
    case 'RR':
      return 5000
    case 'AR':
      return 4000
  }
  return 0
}

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

onMounted(async () => {
  loading.value = true
  try {
    const response = await getProposals()
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
})
</script>

<template>
  <CenteredLayout style="padding: 2rem 0">
    <h2 v-if="loading">Loading your proposals…</h2>
    <template v-else-if="error">
      <h2 style="margin-bottom: 2rem">{{ error }}</h2>
      <PlainButton @click="reload">Refresh</PlainButton>
    </template>
    <template v-else-if="data.length > 0">
      <h2>You’ve got a match!</h2>
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
              <img
                :src="`/images/cards/thumbnails/${card.imageName}`"
                :alt="card.label.eng"
                class="card-image"
              />
            </div>
          </div>

          <div class="exchange-icon"></div>
          <div class="cards">
            <div class="card-container" v-for="(card, index) in group.givenCards" :key="index">
              <img
                :src="`/images/cards/thumbnails/${card.imageName}`"
                :alt="card.label.eng"
                class="card-image"
              />
              <span class="card-count">{{ countGivenCard(card.id) }}</span>
            </div>
          </div>
          <div class="tile-footer">
            <div v-if="group.language">{{ group.language }}</div>
            <div>
              <img src="/images/shinedust.webp" alt="Trade Token" class="trade-token" height="32" />
              <span class="token-count">{{ exchangeTokenCost(group.rarity) }}</span>
            </div>
            <div class="clickable" @click="sendMessage(group)">
              <img src="/images/icons/message.svg" height="20" alt="Message" />
            </div>
          </div>
        </div>
      </div>
    </template>
    <h2 v-else>
      No matching proposals for now :(
      <br />
      Please come back later!
    </h2>
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
  background: linear-gradient(to bottom, #f1f9f1, #e8f3e8);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.card-image {
  height: 188px;
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
  background: #f1f9f1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 1rem;
}

.exchange-icon::before {
  content: '⇅';
  color: #5f6368;
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
  background: white;
  padding: 4px 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.token-count {
  color: #5f6368;
  font-weight: 500;
}
</style>
