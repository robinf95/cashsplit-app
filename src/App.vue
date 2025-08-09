<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useExpenseStore } from './stores/expenses'

const clerk: any = (window as any).Clerk
const user = ref<any>(null)
const expenseStore = useExpenseStore()
let isInitialized = false

onMounted(async () => {
  try {
    user.value = await clerk.user?.reload?.() || clerk.user

    // Initialize the store only once after mounting
    if (!isInitialized) {
      await expenseStore.initialize()
      isInitialized = true
    }
  } catch (error) {
    console.error('Error during app initialization:', error)
    // Initialize store even on error to provide demo data
    if (!isInitialized) {
      await expenseStore.initialize()
      isInitialized = true
    }
  }
})

// Watch for user changes and reinitialize store only when needed
watch(user, async (newUser, oldUser) => {
  // Only reinitialize if user actually changed (not just initial load)
  if (oldUser !== undefined && newUser?.id !== oldUser?.id) {
    if (newUser) {
      await expenseStore.initialize()
    } else {
      // Clear store when user signs out
      expenseStore.$reset()
      isInitialized = false
    }
  }
}, { immediate: false })

const signOut = async () => {
  await clerk.signOut()
  location.href = '/signin'
}

const openSignIn = async () => {
  await clerk.openSignIn()
}
</script>

<template>
  <main class="min-h-screen max-w-xl mx-auto p-4 sm:p-6">
    <header class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-semibold tracking-tight">💸 CashSplit</h1>
      <div class="flex items-center gap-3">
        <span v-if="user" class="text-xs text-gray-600 dark:text-gray-300">Hi, {{ user.firstName || user.username }}</span>
        <button v-if="user" class="text-sm underline" @click="signOut">Logout</button>
        <button v-else class="text-sm underline" @click="openSignIn">Login</button>
      </div>
    </header>
    <router-view />
    <footer class="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
      Built with Vue & Tailwind • Vercel Functions + Postgres • PWA
    </footer>
  </main>
</template>