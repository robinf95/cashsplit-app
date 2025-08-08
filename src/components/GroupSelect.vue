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
  s.addGroup(groupName.value, members, currency.value)
  const id = s.groups[s.groups.length-1].id
  router.push(`/groups/${id}`)
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
          <router-link :to="`/groups/${g.id}`" class="btn-primary">Öffnen</router-link>
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