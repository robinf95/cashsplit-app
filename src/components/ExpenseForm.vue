<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useExpenseStore, type Currency } from '../stores/expenses'

const s = useExpenseStore()
const r = useRoute()
const groupId = computed(() => String(r.params.id))
const g = computed(() => s.groupById(groupId.value))

const amount = ref<string>('')
const note = ref('')
const payer = ref('')
const selected = ref<string[]>([])
const currency = ref<Currency>('EUR')

onMounted(async () => {
  if (g.value) {
    currency.value = g.value.currency
    await s.refreshRates(g.value.currency, ['EUR','USD','CHF','GBP'])
  }
})

function toggleMember(m: string) {
  const i = selected.value.indexOf(m)
  if (i>=0) selected.value.splice(i,1); else selected.value.push(m)
}

function save() {
  const a = Number(amount.value)
  if (!g.value || !a || !payer.value || selected.value.length===0) return
  s.addExpense({ groupId: groupId.value, amount: a, payer: payer.value, for: selected.value, note: note.value, date: new Date().toISOString(), currency: currency.value })
  amount.value=''; note.value=''; selected.value=[]
}
</script>

<template>
  <div v-if="g" class="card">
    <h3 class="text-lg font-semibold mb-2">Ausgabe hinzufügen</h3>
    <div class="grid gap-2">
      <label class="label">Betrag</label>
      <input v-model="amount" type="number" step="0.01" class="input" placeholder="0.00" />
      <label class="label">Währung</label>
      <select v-model="currency" class="input">
        <option>EUR</option><option>USD</option><option>CHF</option><option>GBP</option>
      </select>
      <label class="label">Zahler</label>
      <select v-model="payer" class="input">
        <option disabled value="">— wählen —</option>
        <option v-for="m in g.members" :key="m" :value="m">{{ m }}</option>
      </select>
      <label class="label">Beteiligte</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="m in g.members"
          :key="m"
          type="button"
          :class="['px-3 py-1 rounded-xl border', selected.includes(m) ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-gray-900 text-gray-200']"
          @click="toggleMember(m)"
        >{{ m }}</button>
      </div>
      <label class="label">Notiz</label>
      <input v-model="note" class="input" placeholder="z. B. Abendessen" />
      <button @click="save" class="btn-primary mt-2">Speichern</button>
    </div>
  </div>
</template>