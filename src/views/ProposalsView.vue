<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const findCard = (id: string) => {
  const [set, number] = id.split('-')
  return cards.find((card) => card.set === set && card.number === parseInt(number))
}

const formatFriendID = (friendID: string) => {
  return friendID.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4')
}

const exchangeTokenCost = (proposal: Proposal) => {
  switch (proposal.card1.rarityCode) {
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
  <CenteredLayout>
    <div v-if="data.length > 0" class="list">
      <h2>You’ve got a match!</h2>
      <div class="exchange-tile" v-for="(proposal, index) in data" :key="index">
        <span class="tile-title">Friend ID : {{ formatFriendID(proposal.friend_id) }}</span>
        <div class="card-container">
          <img :src="`/images/cards/${proposal.card1.imageName}`" alt="Card 1" class="card-image" />
        </div>
        <div class="exchange-icon"></div>
        <div class="card-container">
          <img :src="`/images/cards/${proposal.card2.imageName}`" alt="Card 2" class="card-image" />
        </div>
        <div class="tile-footer">
          <img
            src="/images/TRADE_ITEM_130010.webp"
            alt="Trade Token"
            class="trade-token"
            height="32"
          />
          <span class="token-count">{{ exchangeTokenCost(proposal) }}</span>
        </div>
      </div>
    </div>
    <p v-else>
      No matching proposals for now :(
      <br />
      Please come back later!
    </p>
  </CenteredLayout>
</template>

<style scoped>
.list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

h2 {
  text-align: center;
}

.exchange-tile {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 24px;
  background: linear-gradient(to bottom, #f1f9f1, #e8f3e8);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 44px; /* Increased to accommodate footer */
}

.card-container {
  width: 200px;
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
  content: '↔';
  color: #5f6368;
  font-size: 18px;
}

.tile-footer {
  position: absolute;
  top: -12px;
  left: 87px;
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
  right: 12px;
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
