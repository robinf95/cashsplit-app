<template>
  <div class="mt-6">
    <!-- Toggle Buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
      <div class="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
        <button
          @click="showArchived = false"
          :class="[
            'flex-1 sm:flex-none px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors',
            !showArchived
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          <span class="hidden sm:inline">📋 Aktive Zahlungen</span>
          <span class="sm:hidden">📋 Aktiv</span>
          <span class="ml-1">({{ activeExpenses.length }})</span>
        </button>
        <button
          @click="showArchived = true"
          :class="[
            'flex-1 sm:flex-none px-2 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors',
            showArchived
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          <span class="hidden sm:inline">📦 Archivierte Zahlungen</span>
          <span class="sm:hidden">📦 Archiv</span>
          <span class="ml-1">({{ archivedExpenses.length }})</span>
        </button>
      </div>

      <!-- Items per page selector -->
      <div class="flex items-center justify-end space-x-2">
        <label class="text-sm text-gray-600 whitespace-nowrap">Pro Seite:</label>
        <select
          v-model="itemsPerPage"
          class="px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
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
        <table class="w-full min-w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Zahler
              </th>
              <th class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Für
              </th>
              <th class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Betrag
              </th>
              <th class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Notiz
              </th>
              <th class="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              <!-- Date column -->
              <td class="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
                <div class="font-medium">{{ formatDate(expense.date) }}</div>
                <!-- Show payer and recipients on mobile in a compact way -->
                <div class="sm:hidden text-xs text-gray-500 mt-1">
                  <div>{{ expense.payer }} → {{ expense.for.join(', ') }}</div>
                  <div v-if="expense.note" class="mt-1 italic">{{ expense.note }}</div>
                </div>
              </td>

              <!-- Payer column (hidden on mobile) -->
              <td class="px-2 sm:px-4 py-3 text-sm font-medium text-gray-900 hidden sm:table-cell">
                {{ expense.payer }}
              </td>

              <!-- Recipients column (hidden on small and medium screens) -->
              <td class="px-2 sm:px-4 py-3 text-sm text-gray-900 hidden md:table-cell">
                <div class="max-w-32 truncate">{{ expense.for.join(', ') }}</div>
              </td>

              <!-- Amount column -->
              <td class="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
                <div class="font-medium">{{ expense.amount.toFixed(2) }}</div>
                <div class="text-gray-500 text-xs">{{ expense.currency || groupCurrency }}</div>
              </td>

              <!-- Note column (hidden on mobile and tablet) -->
              <td class="px-2 sm:px-4 py-3 text-sm text-gray-900 hidden lg:table-cell">
                <div class="max-w-32 truncate">{{ expense.note || '-' }}</div>
              </td>

              <!-- Actions column -->
              <td class="px-1 sm:px-4 py-3 text-xs">
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                  <button
                    @click="toggleArchive(expense.id)"
                    :class="[
                      'px-1 sm:px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap',
                      expense.archived
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    ]"
                  >
                    <span class="sm:hidden">{{ expense.archived ? '📤' : '📦' }}</span>
                    <span class="hidden sm:inline">{{ expense.archived ? '📤 Wiederherstellen' : '📦 Archivieren' }}</span>
                  </button>
                  <button
                    @click="deleteExpense(expense.id)"
                    class="px-1 sm:px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium transition-colors whitespace-nowrap"
                  >
                    <span class="sm:hidden">🗑️</span>
                    <span class="hidden sm:inline">🗑️ Löschen</span>
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
