<script setup lang="ts">
import { computed } from 'vue'
import { useExpenseStore } from '../stores/expenses'

const props = defineProps<{ groupId: string }>()
const s = useExpenseStore()
const bal = computed(() => s.balances(props.groupId))
const g = computed(() => s.groupById(props.groupId))
</script>

<template>
  <div class="card">
    <h3 class="text-lg font-semibold mb-2">Salden ({{ g?.currency }})</h3>
    <table class="w-full text-sm">
      <tbody>
        <tr v-for="(value, person) in bal" :key="person" class="border-t border-gray-200 dark:border-gray-700">
          <td class="py-2">{{ person }}</td>
          <td class="py-2 text-right" :class="value >= 0 ? 'text-emerald-600' : 'text-red-600'">
            {{ value.toFixed(2) }} {{ g?.currency }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>