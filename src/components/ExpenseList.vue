<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExpenseStore } from '../stores/expenses'
import ExpenseForm from './ExpenseForm.vue'
import BalanceTable from './BalanceTable.vue'
import SettleSuggestions from './SettleSuggestions.vue'
import PaginatedExpenseTable from './PaginatedExpenseTable.vue'

const s = useExpenseStore()
const r = useRoute()
const router = useRouter()
const groupId = computed(() => String(r.params.id))
const g = computed(() => s.groupById(groupId.value))
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

    <!-- Replace the old expense list with the new paginated table -->
    <PaginatedExpenseTable :group-id="groupId" />

    <BalanceTable :group-id="groupId" />
    <SettleSuggestions :group-id="groupId" />
  </section>
</template>