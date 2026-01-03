<script setup lang="ts">
import { onMounted, ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { Message } from '@/types'

import { getMessages, getProposals, postMessage, refreshDiscussions } from '@/services/api'
import { getUserInfo, discussions } from '@/services/store'

import UserBadge from '@/components/atoms/UserBadge.vue'
import CenteredLayout from '@/layouts/CenteredLayout.vue'
import { cards, type Card } from '@/services/cards'

const route = useRoute()
const router = useRouter()

const discussionID = computed(() =>
  Array.isArray(route.params.id) ? route.params.id[0] : route.params.id,
)

const messages = ref([] as Message[])
const composedMessage = ref('')
const showMobileDiscussions = ref(false)

const currentDiscussion = computed(() => {
  return discussions.value.find((discussion) => discussion.friend_id === discussionID.value)
})

const formatDate = (date: string) => {
  // if it's today, return the time
  // if it's yesterday, return "Yesterday"
  // if it’s the same week, return the day of the week
  // if it’s the same year, return the day and the month
  // else return the full date

  const now = new Date()
  const messageDate = new Date(date + ' UTC')
  const diff = now.getTime() - messageDate.getTime()
  const diffDays = Math.floor(diff / (1000 * 3600 * 24))
  if (diffDays === 0) {
    return messageDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return messageDate.toLocaleDateString(undefined, { weekday: 'long' })
  } else if (now.getFullYear() === messageDate.getFullYear()) {
    return messageDate.toLocaleDateString(undefined, { day: '2-digit', month: 'long' })
  } else {
    return messageDate.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }
}

const navigateToDiscussion = async (friendID: string) => {
  showMobileDiscussions.value = false
  await router.push({ name: 'message', params: { id: friendID } })
}

const sendMessage = async () => {
  if (composedMessage.value.length < 1) return

  const response = await postMessage(discussionID.value as string, composedMessage.value)
  if (response === 'created') {
    composedMessage.value = ''
    await refresh()
  } else {
    messages.value.push({
      from: 'error',
      to: discussionID.value as string,
      message: response,
      sent: new Date().toISOString(),
      read: null,
    })
  }
}

const refresh = async () => {
  if (discussionID.value) {
    const oldLength = messages.value.length
    messages.value = (await getMessages(discussionID.value as string)).reverse()
    const newLength = messages.value.length

    if (messages.value.length === 0 && !getUserInfo().has_beta_access) {
      router.push({ name: 'beta' })
    }
    if (currentDiscussion.value?.read === false) {
      await refreshDiscussions()
    }

    if (oldLength !== newLength) {
      // scroll to last message
      nextTick(() => {
        const messagesContainer = document.querySelector('.chat-messages')
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      })
    }
  }
}
watch(discussionID, refresh)

const proposalsCards = ref([] as Card[])
watch(
  discussionID,
  async () => {
    if (proposalsCards.value.length > 0) {
      proposalsCards.value = []
    }

    if (discussionID.value) {
      console.log('refreshing ', discussionID.value)
      const proposals = await getProposals(discussionID.value)
      proposals.forEach(({ card_wanted, card_to_give }) => {
        const card1 = cards.find((card) => card.id === card_wanted)
        if (card1 && !proposalsCards.value.find((card) => card.id === card1.id)) {
          proposalsCards.value.push(card1)
        }
        const card2 = cards.find((card) => card.id === card_to_give)
        if (card2 && !proposalsCards.value.find((card) => card.id === card2.id)) {
          proposalsCards.value.push(card2)
        }
      })
    }
  },
  { immediate: true },
)

const findCardsInMessage = (message: string) => {
  // search by ID
  const cardIDRegex = /([a-zA-Z][0-9][abAB]?\-[0-9]{1,3})/g
  const cardRefs = []
  let match
  while ((match = cardIDRegex.exec(message)) !== null) {
    const cardID = match[1].toUpperCase()

    const card = cards.find((card) => card.id === cardID)
    if (card) {
      cardRefs.push(card)
    }
  }

  // search by name
  message.split(' ').forEach((word) => {
    const found = proposalsCards.value.filter(
      (card) => card.name.toLowerCase() === word.toLowerCase(),
    )
    if (found.length > 0) {
      cardRefs.push(...found)
    }
  })

  return cardRefs.map((card) => ({
    ...card,
    image: `/images/cards/thumbnails/${card.image}`,
  }))
}
const enhancedMessages = computed(() => {
  return messages.value.map((message) => ({
    ...message,
    images: findCardsInMessage(message.message),
  }))
})

let refreshInterval: number
onMounted(async () => {
  await refreshDiscussions()

  if (!discussionID.value && discussions.value.length > 0) {
    await navigateToDiscussion(discussions.value[0].friend_id)
  }
  refresh()
  // 10 seconds = 10 * 1000 ms
  refreshInterval = setInterval(refresh, 10 * 1000)

  composedMessage.value = localStorage.getItem('draft_message') || ''
  localStorage.removeItem('draft_message')
})
onUnmounted(() => {
  if (composedMessage.value.length > 0) {
    localStorage.setItem('draft_message', composedMessage.value)
  }
  clearInterval(refreshInterval)
})
</script>

<template>
  <CenteredLayout v-if="!discussionID && discussions.length === 0">
    <h2>
      You don’t have any conversation yet.
      <br />
      Please use the <router-link to="/account/proposals">proposals</router-link> menu to start a
      new one.
    </h2>
  </CenteredLayout>
  <div v-else class="messenger">
    <div
      v-if="discussions.length > 0"
      class="discussions"
      :class="{ 'hidden-mobile': !showMobileDiscussions }"
    >
      <div v-if="false" class="search-bar">
        <input type="text" placeholder="Rechercher dans Messenger" />
      </div>
      <ul class="discussion-list">
        <li
          v-for="discussion in discussions"
          :key="discussion.friend_id"
          class="discussion-item"
          :class="{
            active: discussion.friend_id === discussionID,
            unread: discussion.read === false,
          }"
          @click="navigateToDiscussion(discussion.friend_id)"
        >
          <img
            v-if="discussion.avatar !== ''"
            :src="`/images/avatars/${discussion.avatar}.png`"
            class="avatar"
            height="40px"
            alt=""
          />
          <div v-else class="avatar">{{ discussion.friend_id.slice(-4) }}</div>
          <div class="content">
            <div v-if="discussion.pseudo !== ''" class="name">
              {{ discussion.pseudo }}
              <span class="language" v-if="discussion.language !== ''"
                >({{ discussion.language }})</span
              >
            </div>
            <div v-else class="name">{{ discussion.friend_id }}</div>
            <div class="last-message">
              {{ discussion.last_message }}
              <span v-if="discussion.last_message.length === 25">…</span>
            </div>
            <div class="time">
              {{ formatDate(discussion.last_message_date) }}
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div class="chat" :class="{ 'hidden-mobile': showMobileDiscussions }">
      <div class="chat-header">
        <div v-if="discussions.length > 0" class="actions show-mobile">
          <button title="List of discussions" @click="showMobileDiscussions = true">
            <svg
              viewBox="6 6 24 24"
              fill="currentColor"
              width="20"
              height="20"
              aria-hidden="true"
              style="--color: var(--primary-color)"
              overflow="visible"
            >
              <path
                d="M17.634 11.384a1.25 1.25 0 0 0-1.768-1.768l-7.5 7.5a1.25 1.25 0 0 0 0 1.768l7.5 7.5a1.25 1.25 0 0 0 1.768-1.768l-4.94-4.94a.25.25 0 0 1 .177-.426H26.75a1.25 1.25 0 1 0 0-2.5H12.871a.25.25 0 0 1-.177-.427l4.94-4.94z"
              ></path>
            </svg>
          </button>
        </div>
        <UserBadge
          :icon="currentDiscussion?.avatar || (route.query.i as string)"
          :pseudo="currentDiscussion?.pseudo || (route.query.p as string)"
          :friendID="currentDiscussion?.friend_id || (discussionID as string) || ''"
          without-border
        />
        <div class="actions">
          <RouterLink
            :to="{ name: 'proposals', query: { id: discussionID } }"
            title="Check common proposals"
          >
            <img src="/images/icons/exchange.svg" alt="" height="28" />
          </RouterLink>
          <button v-if="false" class="more">...</button>
        </div>
      </div>
      <div class="chat-messages">
        <div v-if="false" class="message message-file">
          <a href="#" download="Menu.pdf">Menu.pdf</a>
          <span>2 Mo</span>
        </div>
        <div
          v-for="(message, index) in enhancedMessages"
          :key="index"
          class="message"
          :class="{
            'message-sent': ['me', 'error'].includes(message.from),
            'message-error': message.from === 'error',
          }"
        >
          <div class="message-image-container" v-if="message.images.length > 0">
            <img
              v-for="(card, index) in message.images"
              :key="index"
              class="message-image"
              :src="card.image"
              :alt="card.name"
              :title="card.id"
              width="150"
            />
          </div>
          <p>{{ message.message }}</p>
        </div>
      </div>
      <div class="chat-input">
        <input
          type="text"
          placeholder="Write a message..."
          v-model="composedMessage"
          @keypress.enter="sendMessage"
        />
        <button class="send" @click="sendMessage" :disabled="composedMessage.length < 1">
          <svg height="20px" viewBox="0 0 24 24" width="20px">
            <title>Press enter to send</title>
            <path
              d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 C22.8132856,11.0605983 22.3423792,10.4322088 21.714504,10.118014 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.8376543,3.0486314 1.15159189,3.99121575 L3.03521743,10.4322088 C3.03521743,10.5893061 3.34915502,10.7464035 3.50612381,10.7464035 L16.6915026,11.5318905 C16.6915026,11.5318905 17.1624089,11.5318905 17.1624089,12.0031827 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z"
              fill="var(--active-color)"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
a {
  color: var(--primary-color);
  text-decoration: none;
}
h2 {
  text-align: center;
}

.messenger {
  display: flex;
  gap: 1rem;
  height: calc(100vh - 300px);
}
.discussions {
  width: 300px;
  min-width: fit-content;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.search-bar {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #ddd;
}
.search-bar input {
  width: 100%;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
}
.discussion-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}
.discussion-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-left: 4px solid transparent;
  align-items: center;
}
.discussion-item.active {
  background: var(--active-color);
  border-left-color: var(--primary-color);
}
.discussion-item.unread {
  .name,
  .language,
  .last-message,
  .time {
    font-weight: bold;
  }
}
.language {
  font-size: 0.8rem;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
}
.content {
  display: flex;
  flex-direction: column;
}
.last-message {
  font-size: 0.875rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.time {
  font-size: 0.75rem;
  color: #999;
  flex-shrink: 0;
}
.status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ccc;
  margin-left: 0.5rem;
}
.status.online {
  background: #4caf50;
}
.chat {
  flex-grow: 1;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chat-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  justify-content: space-between;
}
.chat-header .avatar {
  width: 50px;
  height: 50px;
  font-size: 1.25rem;
}
.chat-header .name {
  font-weight: bold;
  font-size: 1.25rem;
  flex-grow: 1;
}
.chat-header .status {
  font-size: 0.875rem;
  color: #666;
}
.chat-header .actions button {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 0.5rem;
  display: flex;
}
.chat-messages {
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.message {
  max-width: 60%;
  background: #f0f0f0;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  word-wrap: break-word;
}
.message-sent {
  background-color: var(--active-color);
  align-self: flex-end;
}
.message-sent.message-error {
  background-color: #ffcccc;
}
.message-image {
  max-width: 100%;
  border-radius: 12px;
}
.message-image-container {
  display: flex;
  gap: 0.5rem;
  overflow-x: scroll;
}
.message-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #e0e0e0;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  max-width: 40%;
}
.message-file a {
  color: #333;
  text-decoration: none;
  font-weight: bold;
}
.chat-input {
  padding: 0.5rem 1rem;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 0.5rem;
}
.chat-input input {
  flex-grow: 1;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
}
.chat-input .send {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.chat-input .send:disabled {
  background: #ccc;
  cursor: not-allowed;
  color: #666;
  opacity: 0.5;
}

.show-mobile {
  display: none;
}

@media (max-width: 768px) {
  .show-mobile {
    display: flex;
  }
  .hidden-mobile {
    display: none;
  }
  .discussions {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .messenger {
    height: calc(100vh - 400px);
  }
}
</style>
