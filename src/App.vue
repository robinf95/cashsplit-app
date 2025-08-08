<script setup lang="ts">
import { onMounted, ref } from 'vue'
const clerk: any = (window as any).Clerk
const user = ref<any>(null)
onMounted(async () => { try { user.value = await clerk.user?.reload?.() || clerk.user } catch {} })
const signOut = async () => { await clerk.signOut(); location.href = '/signin' }
const openSignIn = async () => { await clerk.openSignIn() }
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