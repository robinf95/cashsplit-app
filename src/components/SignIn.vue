<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const clerk = (window as any).Clerk

    if (!clerk) {
      error.value = 'Clerk ist nicht verfügbar. Bitte laden Sie die Seite neu.'
      loading.value = false
      return
    }

    // Wait for Clerk to be fully loaded
    if (!clerk.loaded) {
      await new Promise(resolve => {
        const checkLoaded = () => {
          if (clerk.loaded) {
            resolve(true)
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
      })
    }

    // If user is already signed in, redirect to groups
    if (clerk.user) {
      router.push('/groups')
      return
    }

    // Open sign in modal
    await clerk.openSignIn({
      routing: 'hash',
      afterSignInUrl: '/groups',
      afterSignUpUrl: '/groups'
    })

    loading.value = false
  } catch (err) {
    console.error('Sign in error:', err)
    error.value = 'Fehler beim Laden der Anmeldung. Bitte versuchen Sie es erneut.'
    loading.value = false
  }
})

const retrySignIn = async () => {
  error.value = ''
  loading.value = true

  try {
    const clerk = (window as any).Clerk
    if (clerk) {
      await clerk.openSignIn({
        routing: 'hash',
        afterSignInUrl: '/groups',
        afterSignUpUrl: '/groups'
      })
    }
    loading.value = false
  } catch (err) {
    console.error('Retry sign in error:', err)
    error.value = 'Fehler beim Laden der Anmeldung. Bitte versuchen Sie es erneut.'
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-[60vh] grid place-items-center">
    <div class="text-center card max-w-md mx-auto p-6">
      <h2 class="text-lg font-semibold mb-4">Anmeldung</h2>

      <div v-if="loading" class="text-sm text-gray-500">
        <div class="animate-pulse">Lade Anmeldung...</div>
      </div>

      <div v-else-if="error" class="text-sm">
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button class="btn-primary" @click="retrySignIn">
          Nochmal versuchen
        </button>
      </div>

      <div v-else class="text-sm text-gray-500">
        <p class="mb-4">Das Login-Fenster sollte sich öffnen. Falls nicht, bitte Popups erlauben.</p>
        <button class="btn-primary" @click="retrySignIn">
          Anmeldung öffnen
        </button>
      </div>
    </div>
  </div>
</template>