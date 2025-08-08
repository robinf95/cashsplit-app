<script setup lang="ts">
import { onMounted } from 'vue'
const clerk: any = (window as any).Clerk
onMounted(async () => { await clerk.openSignIn({}); })
</script>
<template>
  <div class="min-h-[60vh] grid place-items-center">
    <div class="text-center card">
      <h2 class="text-lg font-semibold mb-2">Anmeldung</h2>
      <p class="text-sm text-gray-500">Das Login-Fenster sollte sich öffnen. Falls nicht, bitte Popups erlauben.</p>
      <button class="btn-primary mt-3" @click="$forceUpdate()">Nochmal versuchen</button>
    </div>
  </div>
</template>