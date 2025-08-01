<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import PlainButton from '@/components/atoms/PlainButton.vue'
import RarityImage from '@/components/atoms/RarityImage.vue'
import ToggleSwitch from '@/components/atoms/ToggleSwitch.vue'

import { getFriendId, getUserInfo, setUserInfo, type RarityRule } from '@/services/store'
import { updateUser } from '@/services/api'

const MAX_AVATAR_NUMBER = 43
const languages = ['ENG', 'SPA', 'FRA', 'GER', 'ITA', 'POR', 'JPN', 'KOR', 'CHT']

const router = useRouter()

const { rarity_rules, ...info } = getUserInfo()

const user = reactive<{
  accept_notifications: boolean
  friend_id: string
  language: string
  has_beta_access: boolean
  pseudo: string
  icon: string
}>({
  pseudo: '',
  icon: '000',
  language: '',
  accept_notifications: true,
  has_beta_access: false,
  ...info,
  friend_id: getFriendId(),
})
const showIconList = ref(false)
const success = ref(false)

const rarities = reactive({
  C: true,
  U: true,
  R: true,
  RR: true,
  AR: true,
  ...(rarity_rules || []).reduce(
    (acc, rarityRule: RarityRule) => ({
      ...acc,
      [rarityRule.rarity]: rarityRule.enabled === 1,
    }),
    {},
  ),
})

watch(
  () => [user, rarities],
  () => {
    success.value = false
  },
  { deep: true },
)

const selectedIconUrl = computed(() => `/images/avatars/${user.icon || '000'}.png`)

const selectIcon = (iconNumber: number) => {
  user.icon = String(iconNumber).padStart(3, '0')
  showIconList.value = false
}

const configureBeta = () => {
  router.push({ name: 'beta' })
}

const save = async () => {
  setUserInfo({
    ...user,
    rarity_rules: Object.entries(rarities).map(([key, value]) => ({
      rarity: key,
      enabled: value ? 1 : 0,
    })),
  })
  success.value = (await updateUser()) || false
}
</script>

<template>
  <form class="friend-form" @submit.prevent="save">
    <h2>Settings</h2>

    <div class="form-group">
      <label for="icon" class="form-label label-center">Profile Icon</label>
      <div class="selected-icon" @click="showIconList = !showIconList">
        <img :src="selectedIconUrl" alt="Selected Icon" id="icon" />
      </div>
      <div v-if="showIconList" class="icon-list">
        <div v-for="n in MAX_AVATAR_NUMBER" :key="n" class="icon-item" @click="selectIcon(n)">
          <img :src="`/images/avatars/${String(n).padStart(3, '0')}.png`" alt="Icon" />
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="friendId" class="form-label">Friend ID</label>
      <input
        v-model="user.friend_id"
        required
        type="text"
        id="friendId"
        class="friend-id"
        placeholder="0000000000000000"
        pattern="\d{16}"
        maxlength="16"
        :disabled="true"
      />
    </div>
    <div class="form-group">
      <label for="pseudo" class="form-label">Pseudonym (14 characters max)</label>
      <input v-model="user.pseudo" type="text" id="pseudo" class="friend-id" maxlength="14" />
    </div>

    <div class="form-group">
      <label class="form-label">Accept exchange of rarity:</label>

      <ToggleSwitch v-model="rarities.C">
        <RarityImage rarity="C" />
      </ToggleSwitch>
      <ToggleSwitch v-model="rarities.U">
        <RarityImage rarity="U" />
      </ToggleSwitch>
      <ToggleSwitch v-model="rarities.R">
        <RarityImage rarity="R" />
      </ToggleSwitch>
      <ToggleSwitch v-model="rarities.RR">
        <RarityImage rarity="RR" />
      </ToggleSwitch>
      <ToggleSwitch v-model="rarities.AR">
        <RarityImage rarity="AR" />
      </ToggleSwitch>
    </div>

    <div class="form-group">
      <label for="language-input" class="form-label">Your card’s language</label>
      <select id="language-input" v-model="user.language" class="language-input">
        <option value="">Please select</option>
        <option v-for="language in languages" :key="language" :value="language">
          {{ language }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <ToggleSwitch
        :model-value="user.has_beta_access"
        :disabled="user.has_beta_access"
        @update:model-value="configureBeta"
      >
        Access beta features (messages, …)
      </ToggleSwitch>
    </div>

    <PlainButton type="submit" role="button" :disabled="success">{{
      success ? 'Saved!' : 'Save'
    }}</PlainButton>
  </form>
</template>

<style scoped>
h2,
.label-center {
  text-align: center;
}

.friend-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 400px;
  margin: 0 auto;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.form-group {
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 14px;
  color: #5f6368;
}

.friend-id,
.email-input,
.password-input,
.language-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 25px;
  font-size: 14px;
  color: #5f6368;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.friend-id:focus,
.email-input:focus,
.password-input:focus {
  outline: none;
  border-color: #5fd5ff;
  box-shadow: 0 0 0 2px rgba(95, 213, 255, 0.2);
}

.friend-id::placeholder,
.email-input::placeholder,
.password-input::placeholder {
  color: #9e9e9e;
}

/* Invalid state styling */
.friend-id:invalid,
.email-input:invalid {
  border-color: #ff5252;
}

.selected-icon {
  width: 90px;
  height: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  margin: 0 auto;
  border: 1px solid var(--primary-color);
  border-radius: 100%;
}

.selected-icon img {
  max-width: 100%;
  max-height: 100%;
}

.icon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  position: absolute;
  width: 340px;
  z-index: 100;
  background-color: #fffe;
  padding: 1rem;
  border-radius: 25px;
  border: 1px solid var(--primary-color);
  transform: translateX(-60px);
}

.icon-item {
  width: 50px;
  height: 50px;
  cursor: pointer;
}

.icon-item img {
  max-width: 100%;
  max-height: 100%;
}
</style>
