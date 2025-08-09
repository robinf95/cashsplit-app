<script setup lang="ts">
import { computed, ref } from 'vue'
import { useExpenseStore } from '../stores/expenses'

interface Props {
  groupId: string
}

const props = defineProps<Props>()
const store = useExpenseStore()
const isSettling = ref(false)
const showSuccessMessage = ref(false)

// Get settlements for this group
const settlements = computed(() => store.settlements(props.groupId))

// Get group currency
const groupCurrency = computed(() => {
  const group = store.groupById(props.groupId)
  return group?.currency || 'EUR'
})

// Settle all payments by creating balancing expenses
const settleAllPayments = async () => {
  if (settlements.value.length === 0) return

  isSettling.value = true
  showSuccessMessage.value = false

  try {
    const currentDate = new Date().toISOString().split('T')[0]

    // Create settlement expenses for each required payment
    for (const settlement of settlements.value) {
      await store.addExpense({
        groupId: props.groupId,
        payer: settlement.from,
        for: [settlement.to],
        amount: settlement.amount,
        note: `Ausgleichszahlung: ${settlement.from} → ${settlement.to}`,
        date: currentDate,
        currency: groupCurrency.value
      })
    }

    // Show success message
    showSuccessMessage.value = true

    // Hide success message after 3 seconds
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 3000)

  } catch (error) {
    console.error('Error settling payments:', error)
    alert('Fehler beim Ausgleichen der Zahlungen. Bitte versuchen Sie es erneut.')
  } finally {
    isSettling.value = false
  }
}
</script>

<template>
  <div v-if="settlements.length > 0" class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
    <h3 class="text-lg font-semibold text-blue-900 mb-3">
      💰 Ausgleichsvorschläge
    </h3>

    <div class="space-y-2 mb-4">
      <div
        v-for="settlement in settlements"
        :key="`${settlement.from}-${settlement.to}`"
        class="flex items-center justify-between p-3 bg-white rounded border"
      >
        <div class="flex items-center space-x-2">
          <span class="font-medium text-gray-700">{{ settlement.from }}</span>
          <span class="text-gray-500">→</span>
          <span class="font-medium text-gray-700">{{ settlement.to }}</span>
        </div>
        <div class="font-bold text-green-600">
          {{ settlement.amount.toFixed(2) }} {{ groupCurrency }}
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between pt-3 border-t border-blue-200">
      <div class="text-sm text-blue-700">
        {{ settlements.length }} Überweisung{{ settlements.length !== 1 ? 'en' : '' }} erforderlich
      </div>

      <button
        @click="settleAllPayments"
        :disabled="isSettling"
        class="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="isSettling" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Wird ausgeglichen...
        </span>
        <span v-else>
          🏦 Alle Zahlungen ausgleichen
        </span>
      </button>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccessMessage" class="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
      <div class="flex items-center">
        <svg class="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <span class="text-green-800 font-medium">
          Alle Gruppenzahlungen wurden erfolgreich ausgeglichen!
        </span>
      </div>
    </div>
  </div>

  <div v-else class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
    <div class="flex items-center">
      <svg class="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
      <span class="text-green-800 font-medium">
        ✅ Alle Gruppenzahlungen sind bereits ausgeglichen!
      </span>
    </div>
  </div>
</template>