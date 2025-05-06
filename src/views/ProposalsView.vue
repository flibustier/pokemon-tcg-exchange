<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import cards from 'pokemon-tcg-pocket-database/dist/cards.json' with { type: 'json' }

import { getProposals } from '@/services/api'

import CenteredLayout from '@/layouts/CenteredLayout.vue'

type Card = (typeof cards)[0]

interface Proposal {
  friend_id: string
  card_wanted: string
  card_to_give: string
  card1: Card
  card2: Card
}

const data = ref([] as Proposal[])

type ProposalGroup = {
  rarity: string
  friendID: string
  wantedCards: Card[]
  givenCards: Card[]
}

const proposalsByRarityAndFriendId = computed(() => {
  return data.value.reduce((acc: ProposalGroup[], proposal: Proposal): ProposalGroup[] => {
    const rarity = proposal.card1.rarityCode
    const friendID = proposal.friend_id

    const existingGroup = acc.find(
      (group) => group.rarity === rarity && group.friendID === friendID,
    )
    if (existingGroup) {
      if (!existingGroup.wantedCards.includes(proposal.card1)) {
        existingGroup.wantedCards.push(proposal.card1)
      }
      if (!existingGroup.givenCards.includes(proposal.card2)) {
        existingGroup.givenCards.push(proposal.card2)
      }
    } else {
      acc.push({
        rarity,
        friendID,
        wantedCards: [proposal.card1],
        givenCards: [proposal.card2],
      })
    }
    return acc
  }, [])
})

const findCard = (id: string) => {
  const [set, number] = id.split('-')
  return cards.find((card) => card.set === set && card.number === parseInt(number))
}

const formatFriendID = (friendID: string) => {
  return friendID.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')
}

const exchangeTokenCost = (rarity: string) => {
  switch (rarity) {
    case 'R':
      return 120
    case 'RR':
      return 500
    case 'AR':
      return 400
  }
  return 0
}

onMounted(async () => {
  const response = await getProposals()

  data.value = response.map((proposal: Proposal) => ({
    ...proposal,
    card1: findCard(proposal.card_wanted),
    card2: findCard(proposal.card_to_give),
  }))
})
</script>

<template>
  <CenteredLayout style="padding: 2rem 0">
    <template v-if="data.length > 0">
      <h2>You’ve got a match!</h2>

      <div class="list">
        <div
          class="exchange-tile"
          v-for="(group, index) in proposalsByRarityAndFriendId"
          :key="index"
        >
          <span class="tile-title">Friend ID : {{ formatFriendID(group.friendID) }}</span>
          <div class="cards">
            <div class="card-container" v-for="(card, index) in group.wantedCards" :key="index">
              <img
                :src="`/images/cards/${card.imageName}`"
                :alt="card.label.eng"
                class="card-image"
              />
            </div>
          </div>

          <div class="exchange-icon"></div>
          <div class="cards">
            <div class="card-container" v-for="(card, index) in group.givenCards" :key="index">
              <img
                :src="`/images/cards/${card.imageName}`"
                :alt="card.label.eng"
                class="card-image"
              />
            </div>
          </div>
          <div class="tile-footer">
            <img
              src="/images/TRADE_ITEM_130010.webp"
              alt="Trade Token"
              class="trade-token"
              height="32"
            />
            <span class="token-count">{{ exchangeTokenCost(group.rarity) }}</span>
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
}

.exchange-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
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
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image {
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
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
  top: 515px;
  transform: none;
  background: white;
  padding: 4px 16px;
  border-radius: 12px;
  font-size: 14px;
  color: #5f6368;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tile-title {
  position: absolute;
  top: -12px;
  transform: none;
  background: white;
  padding: 4px 16px;
  border-radius: 12px;
  font-size: 14px;
  color: #5f6368;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
