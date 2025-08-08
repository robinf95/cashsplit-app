<script setup lang="ts">
import { computed } from 'vue'
import { useExpenseStore } from '../stores/expenses'

const props = defineProps<{ groupId: string }>()
const s = useExpenseStore()
const settlements = computed(() => s.settlements(props.groupId))
const g = computed(() => s.groupById(props.groupId))
</script>

<template>
  <div class="card">
    <h3 class="text-lg font-semibold mb-2">Ausgleichsvorschläge</h3>
    <div v-if="settlements.length === 0" class="text-sm text-gray-500">
      Keine Ausgleichszahlungen nötig.
    </div>
    <ul class="space-y-2">
      <li v-for="(t, i) in settlements" :key="i" class="flex items-center justify-between">
        <div class="text-sm">
          <b>{{ t.from }}</b> → <b>{{ t.to }}</b>
        </div>
        <div class="font-medium">{{ t.amount.toFixed(2) }} {{ g?.currency }}</div>
      </li>
    </ul>
  </div>
</template>