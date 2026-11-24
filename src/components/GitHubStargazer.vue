<script setup lang="ts">
import { ref, reactive, onUnmounted, computed } from 'vue'

import { t } from '@/services/i18n'

import PlainButton from '@/components/atoms/PlainButton.vue'
import RichText from '@/components/atoms/RichText'
import HorizontalSeparator from '@/components/atoms/HorizontalSeparator.vue'

const CHECK_INTERVAL_MS = 5_000
const AUTO_ACCEPT_AFTER_60_SECONDS = true

const emit = defineEmits(['success'])

const success = ref(false)
const submitted = ref(false)
const ghUsername = ref('')
const accessCode = ref('')
const stargazers = ref([] as string[])
const checkTimer = ref(12) // 12 * 5 seconds = 60 seconds
const checkInterval = ref(0)
const errors = reactive({
  accessCode: false,
  ghUsername: false,
})

const fetchStargazers = async (): Promise<string[]> => {
  const response = await fetch(
    'https://api.github.com/repos/flibustier/pokemon-tcg-exchange/stargazers',
  )
  const data = await response.json()

  return data.map((star: { login: string }) => star.login)
}

const isAccessCodeValid = computed(() => {
  return accessCode.value.toUpperCase() === 'FRIEND'
})

const submit = async () => {
  if (
    stargazers.value.includes(ghUsername.value) ||
    isAccessCodeValid.value ||
    checkTimer.value <= 0
  ) {
    console.log('ACCESS GRANTED')
    emit('success', isAccessCodeValid.value ? '' : ghUsername.value)
    return
  }

  if (ghUsername.value.length > 0 && !success.value && checkInterval.value > 0) {
    submitted.value = true
    return
  }

  errors.ghUsername = ghUsername.value.length > 0
  errors.accessCode = accessCode.value.length > 0
}

const cancel = () => {
  submitted.value = false
}

const checkStaring = async () => {
  const currentStargazers = await fetchStargazers()

  if (submitted.value && AUTO_ACCEPT_AFTER_60_SECONDS) {
    checkTimer.value--
  }

  if (currentStargazers.length === stargazers.value.length && checkTimer.value > 0) return

  if (ghUsername.value === '') {
    ghUsername.value =
      currentStargazers.find((username) => !stargazers.value.includes(username)) || ''
  }

  success.value = true
  stargazers.value = currentStargazers
  clearInterval(checkInterval.value)
  submit()
}

const autoFetch = async () => {
  stargazers.value = await fetchStargazers()

  checkInterval.value = setInterval(checkStaring, CHECK_INTERVAL_MS)
}

onUnmounted(() => {
  clearInterval(checkInterval.value)
})
</script>

<template>
  <div v-if="submitted" class="column-center">
    <img src="/images/icons/grid.svg" alt="" height="40" />

    <p>{{ t('beta.checking') }}</p>

    <PlainButton type="button" role="button" @click="cancel">
      {{ t('beta.cancel') }}
    </PlainButton>
  </div>
  <template v-else>
    <p>{{ t('beta.intro') }}</p>

    <span class="github-btn-large" @click="autoFetch">
      <a
        class="gh-btn"
        href="https://github.com/flibustier/pokemon-tcg-exchange"
        rel="noopener noreferrer"
        target="_blank"
        :aria-label="t('beta.starLabel')"
      >
        <span class="gh-ico" aria-hidden="true" />
        <span class="gh-text">{{ t('beta.star') }}</span>
      </a>
    </span>

    <div class="form-group">
      <label for="username" class="form-label">{{ t('beta.username') }}</label>
      <input v-model="ghUsername" type="text" id="username" class="form-input" />
      <p v-if="errors.ghUsername && ghUsername.length > 0" class="form-error">
        <RichText text="beta.usernameError">
          <template #mail>
            <a href="mailto:help@pokemon-tcg.exchange?subject=Beta%20Access"
              >help@pokemon-tcg.exchange</a
            >
          </template>
        </RichText>
      </p>
    </div>

    <HorizontalSeparator>{{ t('beta.or') }}</HorizontalSeparator>

    <p><RichText text="beta.codeIntro" /></p>

    <div class="form-group">
      <label for="accessCode" class="form-label">{{ t('beta.code') }}</label>
      <input
        v-model="accessCode"
        type="text"
        id="accessCode"
        class="form-input"
        autocapitalize="characters"
      />
      <p v-if="errors.accessCode" class="form-error">
        {{ t('beta.codeError') }}
      </p>
    </div>

    <PlainButton
      type="submit"
      role="button"
      :disabled="ghUsername.length < 1 && accessCode.length < 3"
      @click="submit"
    >
      {{ t('beta.submit') }}
    </PlainButton>
  </template>
</template>

<style scoped>
.column-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.github-btn-large {
  margin: 0 auto;
}

.gh-btn {
  padding: 3px 10px 3px 8px;
  font-size: 16px;
  line-height: 22px;
  border-radius: 4px;
  color: var(--color-text);
  white-space: nowrap;
  cursor: pointer;
  background-color: var(--color-surface-mute);
  background-image: linear-gradient(
    to bottom,
    var(--color-surface-soft) 0,
    var(--color-surface-mute) 100%
  );
  background-repeat: no-repeat;
  border: 1px solid var(--color-border-strong);
  text-decoration: none;
}
.gh-ico {
  width: 20px;
  height: 20px;
  margin-right: 4px;
  background: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='12 12 40 40'%3e%3cpath fill='%23333' d='M32 13.4c-10.5 0-19 8.5-19 19 0 8.4 5.5 15.5 13 18 1 .2 1.3-.4 1.3-.9v-3.2c-5.3 1.1-6.4-2.6-6.4-2.6-.9-2.1-2.1-2.7-2.1-2.7-1.7-1.2.1-1.1.1-1.1 1.9.1 2.9 2 2.9 2 1.7 2.9 4.5 2.1 5.5 1.6.2-1.2.7-2.1 1.2-2.6-4.2-.5-8.7-2.1-8.7-9.4 0-2.1.7-3.7 2-5.1-.2-.5-.8-2.4.2-5 0 0 1.6-.5 5.2 2 1.5-.4 3.1-.7 4.8-.7 1.6 0 3.3.2 4.7.7 3.6-2.4 5.2-2 5.2-2 1 2.6.4 4.6.2 5 1.2 1.3 2 3 2 5.1 0 7.3-4.5 8.9-8.7 9.4.7.6 1.3 1.7 1.3 3.5v5.2c0 .5.4 1.1 1.3.9 7.5-2.6 13-9.7 13-18.1 0-10.5-8.5-19-19-19z'/%3e%3c/svg%3e")
    0 0/100% 100% no-repeat;
  filter: var(--icon-filter);
}
.gh-btn,
.gh-ico {
  float: left;
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

.form-error {
  color: var(--color-error);
}

.form-input {
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

.form-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-shadow);
}

.form-input::placeholder {
  color: var(--color-text-subtle);
}

.form-input:invalid {
  border-color: var(--color-danger);
}
</style>
