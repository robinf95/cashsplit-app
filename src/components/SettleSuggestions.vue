<script setup lang="ts">
import { computed, ref } from 'vue'
import { useExpenseStore, type Currency } from '../stores/expenses'

interface Props {
  groupId: string
}

type SettlementWithCurrency = {
  from: string
  to: string
  amount: number
  originalAmount: number
  convertedAmount: number
  currency: Currency
}

const props = defineProps<Props>()
const store = useExpenseStore()
const isSettling = ref(false)
const showSuccessMessage = ref(false)
const selectedCurrency = ref<Currency | null>(null)

// Available currencies
const availableCurrencies: Currency[] = ['EUR', 'USD', 'CHF', 'GBP']

// Get settlements for this group
const settlements = computed(() => store.settlements(props.groupId))

// Get group currency
const groupCurrency = computed(() => {
  const group = store.groupById(props.groupId)
  return group?.currency || 'EUR'
})

// Initialize selected currency to group currency
if (!selectedCurrency.value) {
  selectedCurrency.value = groupCurrency.value
}

// Convert amount from group currency to selected currency
const convertAmount = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
  if (fromCurrency === toCurrency) return amount

  const exchangeKey = `${fromCurrency}->${toCurrency}`
  const rate = store.fx[exchangeKey]

  if (rate) {
    return amount * rate
  }

  // Fallback: try reverse rate
  const reverseKey = `${toCurrency}->${fromCurrency}`
  const reverseRate = store.fx[reverseKey]
  if (reverseRate) {
    return amount / reverseRate
  }

  // If no rate available, return original amount
  console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}`)
  return amount
}

// Get settlements with converted amounts
const settlementsWithCurrency = computed((): SettlementWithCurrency[] => {
  if (!selectedCurrency.value) {
    return settlements.value.map(settlement => ({
      ...settlement,
      originalAmount: settlement.amount,
      convertedAmount: settlement.amount,
      currency: groupCurrency.value
    }))
  }

  return settlements.value.map(settlement => ({
    ...settlement,
    originalAmount: settlement.amount,
    convertedAmount: convertAmount(settlement.amount, groupCurrency.value, selectedCurrency.value!),
    currency: selectedCurrency.value!
  }))
})

// Check if exchange rates are needed and available
const hasExchangeRates = computed(() => {
  if (selectedCurrency.value === groupCurrency.value) return true

  const exchangeKey = `${groupCurrency.value}->${selectedCurrency.value}`
  const reverseKey = `${selectedCurrency.value}->${groupCurrency.value}`

  return !!(store.fx[exchangeKey] || store.fx[reverseKey])
})

// Settle all payments by creating balancing expenses
const settleAllPayments = async () => {
  if (settlements.value.length === 0 || !selectedCurrency.value) return

  // Check if we need exchange rates and don't have them
  if (!hasExchangeRates.value) {
    alert(`Keine Wechselkurse für ${groupCurrency.value} → ${selectedCurrency.value} verfügbar. Bitte aktualisieren Sie die Wechselkurse.`)
    return
  }

  isSettling.value = true
  showSuccessMessage.value = false

  try {
    // First, archive all active expenses before settlement
    await store.archiveActiveExpenses(props.groupId)

    const currentDate = new Date().toISOString().split('T')[0]

    // Create settlement expenses for each required payment
    for (const settlement of settlementsWithCurrency.value) {
      // Use converted amount for the actual expense
      const expenseAmount = settlement.convertedAmount
      const currencyNote = selectedCurrency.value !== groupCurrency.value
        ? ` (${settlement.originalAmount.toFixed(2)} ${groupCurrency.value} → ${settlement.convertedAmount.toFixed(2)} ${selectedCurrency.value})`
        : ''

      await store.addExpense({
        groupId: props.groupId,
        payer: settlement.from,
        for: [settlement.to],
        amount: expenseAmount,
        note: `Ausgleichszahlung: ${settlement.from} → ${settlement.to}${currencyNote}`,
        date: currentDate,
        currency: selectedCurrency.value
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

    <!-- Currency Selection -->
    <div class="mb-4 p-3 bg-white rounded border">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Zahlungswährung wählen:
      </label>
      <div class="flex items-center space-x-4">
        <select
          v-model="selectedCurrency"
          class="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="currency in availableCurrencies" :key="currency" :value="currency">
            {{ currency }}
          </option>
        </select>

        <div v-if="selectedCurrency !== groupCurrency" class="text-sm text-gray-600">
          Umrechnung von {{ groupCurrency }} → {{ selectedCurrency }}
          <span v-if="!hasExchangeRates" class="text-red-600 font-medium ml-1">
            (Keine Wechselkurse verfügbar!)
          </span>
        </div>
      </div>
    </div>

    <!-- Settlement List -->
    <div class="space-y-2 mb-4">
      <div
        v-for="settlement in settlementsWithCurrency"
        :key="`${settlement.from}-${settlement.to}`"
        class="flex items-center justify-between p-3 bg-white rounded border"
      >
        <div class="flex items-center space-x-2">
          <span class="font-medium text-gray-700">{{ settlement.from }}</span>
          <span class="text-gray-500">→</span>
          <span class="font-medium text-gray-700">{{ settlement.to }}</span>
        </div>
        <div class="text-right">
          <div class="font-bold text-green-600">
            {{ settlement.convertedAmount.toFixed(2) }} {{ selectedCurrency }}
          </div>
          <div v-if="selectedCurrency !== groupCurrency && hasExchangeRates" class="text-xs text-gray-500">
            ({{ settlement.originalAmount.toFixed(2) }} {{ groupCurrency }})
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between pt-3 border-t border-blue-200">
      <div class="text-sm text-blue-700">
        {{ settlements.length }} Überweisung{{ settlements.length !== 1 ? 'en' : '' }} erforderlich
        <span v-if="selectedCurrency !== groupCurrency">
          in {{ selectedCurrency }}
        </span>
      </div>

      <button
        @click="settleAllPayments"
        :disabled="isSettling || !hasExchangeRates"
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
          🏦 Alle Zahlungen ausgleichen{{ selectedCurrency !== groupCurrency ? ` (${selectedCurrency})` : '' }}
        </span>
      </button>
    </div>

    <!-- Exchange Rate Warning -->
    <div v-if="selectedCurrency !== groupCurrency && !hasExchangeRates" class="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
      <div class="flex items-center">
        <svg class="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <span class="text-yellow-800">
          Keine Wechselkurse für {{ groupCurrency }} → {{ selectedCurrency }} verfügbar. Bitte aktualisieren Sie die Wechselkurse in den Einstellungen.
        </span>
      </div>
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