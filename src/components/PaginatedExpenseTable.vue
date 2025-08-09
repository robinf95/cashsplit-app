<template>
  <div class="mt-6">
    <!-- Toggle Buttons -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex bg-gray-100 rounded-lg p-1">
        <button
          @click="showArchived = false"
          :class="[
            'px-4 py-2 rounded-md font-medium transition-colors',
            !showArchived
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          📋 Aktive Zahlungen ({{ activeExpenses.length }})
        </button>
        <button
          @click="showArchived = true"
          :class="[
            'px-4 py-2 rounded-md font-medium transition-colors',
            showArchived
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          📦 Archivierte Zahlungen ({{ archivedExpenses.length }})
        </button>
      </div>

      <!-- Items per page selector -->
      <div class="flex items-center space-x-2">
        <label class="text-sm text-gray-600">Pro Seite:</label>
        <select
          v-model="itemsPerPage"
          class="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>

    <!-- Expenses Table -->
    <div class="bg-white rounded-lg border overflow-hidden">
      <div v-if="paginatedExpenses.length === 0" class="p-8 text-center text-gray-500">
        <div class="text-4xl mb-2">{{ showArchived ? '📦' : '📋' }}</div>
        <p>{{ showArchived ? 'Keine archivierten Zahlungen vorhanden.' : 'Keine aktiven Zahlungen vorhanden.' }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zahler
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Für
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Betrag
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notiz
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="expense in paginatedExpenses"
              :key="expense.id"
              :class="{ 'bg-gray-50': expense.archived }"
            >
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(expense.date) }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ expense.payer }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {{ expense.for.join(', ') }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                <span class="font-medium">{{ expense.amount.toFixed(2) }}</span>
                <span class="text-gray-500 ml-1">{{ expense.currency || groupCurrency }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                {{ expense.note || '-' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <div class="flex items-center space-x-2">
                  <button
                    @click="toggleArchive(expense.id)"
                    :class="[
                      'px-2 py-1 rounded text-xs font-medium transition-colors',
                      expense.archived
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    ]"
                  >
                    {{ expense.archived ? '📤 Wiederherstellen' : '📦 Archivieren' }}
                  </button>
                  <button
                    @click="deleteExpense(expense.id)"
                    class="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium transition-colors"
                  >
                    🗑️ Löschen
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
        <div class="text-sm text-gray-600">
          Zeige {{ startItem }} bis {{ endItem }} von {{ totalItems }} Einträgen
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="currentPage = 1"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏮️
          </button>
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⬅️
          </button>

          <span class="px-3 py-1 text-sm">
            Seite {{ currentPage }} von {{ totalPages }}
          </span>

          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ➡️
          </button>
          <button
            @click="currentPage = totalPages"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏭️
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useExpenseStore } from '../stores/expenses'

interface Props {
  groupId: string
}

const props = defineProps<Props>()
const store = useExpenseStore()

// Reactive state
const showArchived = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Get expenses based on archive status
const activeExpenses = computed(() => store.activeExpenses(props.groupId))
const archivedExpenses = computed(() => store.archivedExpenses(props.groupId))

// Current expenses to display
const currentExpenses = computed(() => {
  const expenses = showArchived.value ? archivedExpenses.value : activeExpenses.value
  // Sort by date (newest first)
  return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// Group currency
const groupCurrency = computed(() => {
  const group = store.groupById(props.groupId)
  return group?.currency || 'EUR'
})

// Pagination calculations
const totalItems = computed(() => currentExpenses.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
const startItem = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1)
const endItem = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value))

// Paginated expenses
const paginatedExpenses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return currentExpenses.value.slice(start, end)
})

// Reset pagination when switching between active/archived or when items per page changes
watch([showArchived, itemsPerPage], () => {
  currentPage.value = 1
})

// Utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const toggleArchive = async (expenseId: string) => {
  try {
    await store.toggleExpenseArchive(expenseId)
  } catch (error) {
    console.error('Error toggling archive status:', error)
    alert('Fehler beim Ändern des Archivstatus. Bitte versuchen Sie es erneut.')
  }
}

const deleteExpense = async (expenseId: string) => {
  if (confirm('Sind Sie sicher, dass Sie diese Zahlung löschen möchten?')) {
    try {
      await store.removeExpense(expenseId)
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Fehler beim Löschen der Zahlung. Bitte versuchen Sie es erneut.')
    }
  }
}
</script>
