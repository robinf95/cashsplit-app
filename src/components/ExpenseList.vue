<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExpenseStore } from '../stores/expenses'
import ExpenseForm from './ExpenseForm.vue'
import BalanceTable from './BalanceTable.vue'
import SettleSuggestions from './SettleSuggestions.vue'

const s = useExpenseStore()
const r = useRoute()
const router = useRouter()
const groupId = computed(() => String(r.params.id))
const g = computed(() => s.groupById(groupId.value))
const list = computed(() => s.expenses.filter(e => e.groupId === groupId.value).slice().reverse())
</script>

<template>
  <section v-if="g" class="grid gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">{{ g.name }} <span class="text-xs text-gray-400">({{ g.currency }})</span></h2>
        <div class="text-xs text-gray-500">{{ g.members.join(', ') }}</div>
      </div>
      <button class="text-sm underline" @click="router.push('/groups')">← Gruppen</button>
    </div>

    <ExpenseForm />

    <div class="card">
      <h3 class="text-lg font-semibold mb-2">Ausgaben</h3>
      <div v-if="list.length === 0" class="text-sm text-gray-500">Noch keine Ausgaben.</div>
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li v-for="e in list" :key="e.id" class="py-2 flex items-center justify-between">
          <div>
            <div class="font-medium">{{ e.note || 'Ausgabe' }} — {{ e.amount.toFixed(2) }} {{ e.currency || g.currency }}</div>
            <div class="text-xs text-gray-500">{{ e.payer }} hat gezahlt · Für: {{ e.for.join(', ') }}</div>
          </div>
          <button class="text-xs text-red-600" @click="$pinia._s.get('expenses')?.removeExpense(e.id)">Löschen</button>
        </li>
      </ul>
    </div>

    <BalanceTable :group-id="groupId" />
    <SettleSuggestions :group-id="groupId" />
  </section>
</template>