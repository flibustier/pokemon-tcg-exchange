<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import PlainButton from '@/components/atoms/PlainButton.vue'
import RarityImage from '@/components/atoms/RarityImage.vue'
import ToggleSwitch from '@/components/atoms/ToggleSwitch.vue'
import BaseModal from '@/components/modals/BaseModal.vue'

import { getUserInfo, setLogOut, setUserInfo, userInfo, type RarityRule } from '@/services/store'
import { deleteAccount, updateUser } from '@/services/api'

const MAX_AVATAR_NUMBER = 123
const languages = ['ENG', 'SPA', 'FRA', 'GER', 'ITA', 'POR', 'JPN', 'KOR', 'CHT']

const router = useRouter()

// email and email_status come from the server: they are not settings saved with the others
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { rarity_rules, email, email_status, ...info } = getUserInfo()

const emailStatusLabel = computed(() => {
  if (userInfo.value.email_status === 'pending') return 'not confirmed yet'
  if (userInfo.value.email_status === 'verified') return 'confirmed'
  return ''
})

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
})
const showIconList = ref(false)
const success = ref(false)

const rarities = reactive({
  C: true,
  U: true,
  R: true,
  RR: true,
  AR: true,
  SR: true,
  SAR: true,
  S: true,
  SSR: true,
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

const CONFIRMATION_WORD = 'DELETE'
const showDeletion = ref(false)
const typedConfirmation = ref('')
const isDeleting = ref(false)
const deletionError = ref('')

const openDeletion = () => {
  typedConfirmation.value = ''
  deletionError.value = ''
  showDeletion.value = true
}

const confirmDeletion = async () => {
  if (typedConfirmation.value !== CONFIRMATION_WORD || isDeleting.value) return

  isDeleting.value = true
  deletionError.value = ''
  try {
    const result = await deleteAccount()
    if (result === 'deleted') {
      setLogOut()
      window.location.replace('/')
      return
    }
    deletionError.value = result === 'ko' ? 'the server is busy, please try again' : result
  } catch {
    deletionError.value = 'the server could not be reached, please try again'
  }
  isDeleting.value = false
}
</script>

<template>
  <form class="friend-form" @submit.prevent="save">
    <h2>Settings</h2>

    <div class="form-group">
      <label for="icon" class="form-label label-center">Profile Icon</label>
      <div
        class="selected-icon"
        :class="{ invalid: !user.icon }"
        @click="showIconList = !showIconList"
      >
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
    <div class="form-group" v-if="userInfo.email">
      <label for="email" class="form-label"
        >Email <span v-if="emailStatusLabel">({{ emailStatusLabel }})</span></label
      >
      <input :value="userInfo.email" type="email" id="email" class="friend-id" :disabled="true" />
    </div>
    <div class="form-group">
      <label for="pseudo" class="form-label">Pseudonym (14 characters max)</label>
      <input
        v-model="user.pseudo"
        type="text"
        id="pseudo"
        class="friend-id"
        maxlength="14"
        required
      />
    </div>

    <div class="form-group">
      <label for="language-input" class="form-label">Your card’s language</label>
      <select id="language-input" v-model="user.language" class="language-input" required>
        <option value="" disabled>Please select</option>
        <option v-for="language in languages" :key="language" :value="language">
          {{ language }}
        </option>
      </select>
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
      <ToggleSwitch
        v-model="rarities.SR"
        @update:model-value="(newValue) => (rarities.SAR = newValue)"
      >
        <RarityImage rarity="SR" />
      </ToggleSwitch>
      <ToggleSwitch v-model="rarities.S">
        <RarityImage rarity="S" />
      </ToggleSwitch>
      <ToggleSwitch v-model="rarities.SSR">
        <RarityImage rarity="SSR" />
      </ToggleSwitch>
    </div>

    <div class="form-group">
      <ToggleSwitch v-model="user.accept_notifications"> Email notifications </ToggleSwitch>

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

    <div class="danger-zone">
      <RouterLink to="/logout" class="danger-button">Logout</RouterLink>
      <button type="button" class="danger-button" @click="openDeletion">Delete my account</button>
    </div>
  </form>

  <BaseModal v-model="showDeletion" title="Delete your account">
    <form class="deletion" @submit.prevent="confirmDeletion">
      <p>This deletes for good, and cannot be undone:</p>
      <ul>
        <li>your wishlist, your offers and your settings,</li>
        <li>your email, your password and your friend ID.</li>
      </ul>
      <p>
        The players you talked with keep your messages, from a “Deleted player” they can no longer
        answer.
      </p>
      <label for="delete-confirmation"
        >Type <strong>{{ CONFIRMATION_WORD }}</strong> to confirm</label
      >
      <input
        v-model.trim="typedConfirmation"
        id="delete-confirmation"
        class="friend-id"
        autocomplete="off"
        autocapitalize="characters"
      />
      <button
        type="submit"
        class="danger-button"
        :disabled="typedConfirmation !== CONFIRMATION_WORD || isDeleting"
      >
        {{ isDeleting ? 'Deleting…' : 'Delete my account for good' }}
      </button>
      <p v-if="deletionError" class="deletion-error" role="alert">Error: {{ deletionError }}</p>
    </form>
  </BaseModal>
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
  background: var(--color-surface-soft);
  border-radius: 12px;
  box-shadow: 0 4px 8px var(--shadow-color);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.form-group {
  position: relative;
}

.form-label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 14px;
  color: var(--color-text-muted);
}

.friend-id,
.email-input,
.password-input,
.language-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 25px;
  font-size: 14px;
  color: var(--color-text-muted);
  background: var(--color-surface);
  box-shadow: 0 1px 3px var(--shadow-color);
  transition: all 0.2s ease;
}

.friend-id:focus,
.email-input:focus,
.password-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.friend-id::placeholder,
.email-input::placeholder,
.password-input::placeholder {
  color: var(--color-text-subtle);
}

/* Invalid state styling */
.friend-id:invalid,
.email-input:invalid,
.selected-icon.invalid,
.language-input:invalid {
  border-color: var(--color-danger);
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
  background-color: var(--color-background-glass);
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

.danger-zone {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.danger-button {
  display: inline-block;
  padding: 8px 20px;
  border: 1px solid var(--color-danger);
  border-radius: 25px;
  background: var(--color-surface);
  color: var(--color-danger);
  font-family: inherit;
  font-size: 14px;
  line-height: normal;
  text-decoration: none;
  cursor: pointer;
}

.danger-button:hover:not(:disabled) {
  background: var(--color-danger);
  color: var(--color-surface);
}

.danger-button:disabled {
  border-color: var(--color-border);
  color: var(--color-text-subtle);
  cursor: not-allowed;
}

.deletion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 420px;
}

.deletion ul {
  padding-left: 1.5rem;
}

.deletion-error {
  color: var(--color-danger);
}
</style>
