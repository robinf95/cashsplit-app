<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useExpenseStore, type Currency } from '../stores/expenses'

const s = useExpenseStore()
const router = useRouter()
const groupName = ref('')
const memberNames = ref('Alice,Bob')
const currency = ref<Currency>('EUR')

async function create() {
  const members = memberNames.value.split(',').map(x=>x.trim()).filter(Boolean)
  if (!groupName.value || members.length < 1) return

  try {
    await s.addGroup(groupName.value, members, currency.value)
    // Now get the ID from the last group that was actually added
    const newGroup = s.groups[s.groups.length-1]
    if (newGroup?.id) {
      router.push(`/groups/${newGroup.id}`)
    }
  } catch (error) {
    console.error('Failed to create group:', error)
    // Show error to user or handle gracefully
  }
}

async function deleteGroup(groupId: string, groupName: string) {
  if (confirm(`Möchten Sie die Gruppe "${groupName}" wirklich löschen? Alle zugehörigen Ausgaben werden ebenfalls gelöscht.`)) {
    try {
      await s.deleteGroup(groupId)
      // If we're currently viewing this group, redirect to home
      if (router.currentRoute.value.params.id === groupId) {
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
      alert('Fehler beim Löschen der Gruppe')
    }
  }
}
</script>

<template>
  <section class="grid gap-4">
    <div class="card">
      <h2 class="text-lg font-semibold mb-2">Gruppen</h2>
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li v-for="g in s.groups" :key="g.id" class="py-2 flex items-center justify-between">
          <div>
            <div class="font-medium">{{ g.name }}</div>
            <div class="text-xs text-gray-500">{{ g.members.join(', ') }} · {{ g.currency }}</div>
          </div>
          <div class="flex gap-2">
            <router-link :to="`/groups/${g.id}`" class="btn-primary">Öffnen</router-link>
            <button
              @click="deleteGroup(g.id, g.name)"
              class="btn-secondary text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 p-2"
              title="Gruppe löschen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </li>
      </ul>
    </div>

    <div class="card">
      <h2 class="text-lg font-semibold mb-2">Neue Gruppe</h2>
      <div class="grid gap-2">
        <label class="label">Name</label>
        <input v-model="groupName" class="input" placeholder="z. B. Kreta 2025" />
        <label class="label">Mitglieder (Kommagetrennt)</label>
        <input v-model="memberNames" class="input" />
        <label class="label">Währung</label>
        <select v-model="currency" class="input">
          <option>EUR</option><option>USD</option><option>CHF</option><option>GBP</option>
        </select>
        <button @click="create" class="btn-primary mt-2">Erstellen</button>
      </div>
    </div>
  </section>
</template>