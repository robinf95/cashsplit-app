import { defineStore } from 'pinia'
export type Currency = 'EUR' | 'USD' | 'CHF' | 'GBP'
export type PersonId = string
export type Group = { id: string; name: string; members: PersonId[]; currency: Currency }
export type Expense = { id: string; groupId: string; payer: PersonId; for: PersonId[]; amount: number; note?: string; date: string; currency?: Currency }
type State = { groups: Group[]; expenses: Expense[]; fx: Record<string, number>; base: Currency }
const STORAGE_KEY = 'cashsplit_full_v1'

function save(s: State){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }
function load(): State | null { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as State : null } catch { return null } }

export const useExpenseStore = defineStore('expenses', {
  state: (): State => (load() ?? ({ groups:[{ id:'demo', name:'Beispielgruppe', members:['Alice','Bob','Clara'], currency:'EUR'}], expenses:[], fx:{}, base:'EUR' })),
  getters: {
    groupById: (s) => (id: string) => s.groups.find(g => g.id === id),
    balances: (s) => (groupId: string) => {
      const g = s.groups.find(g => g.id === groupId); if (!g) return {}
      const bal: Record<string, number> = {}; g.members.forEach(m => bal[m] = 0)
      s.expenses.filter(e => e.groupId === groupId).forEach(e => {
        const eCur = e.currency || g.currency
        const factor = (eCur === g.currency) ? 1 : (s.fx[`${eCur}->${g.currency}`] || 1)
        const amt = e.amount * factor
        const share = amt / e.for.length
        bal[e.payer] += amt
        e.for.forEach(m => bal[m] -= share)
      })
      Object.keys(bal).forEach(k => bal[k] = Math.round(bal[k]*100)/100)
      return bal
    },
    settlements() {
      return (groupId: string) => {
        const b = { ...this.balances(groupId) } as Record<string, number>
        const debtors = Object.entries(b).filter(([,v]) => v < 0).sort((a,b)=>a[1]-b[1])
        const creditors = Object.entries(b).filter(([,v]) => v > 0).sort((a,b)=>b[1]-a[1])
        const res: { from:PersonId; to:PersonId; amount:number }[] = []
        let i=0,j=0
        while (i<debtors.length && j<creditors.length) {
          const [dId, dAmt] = debtors[i]; const [cId, cAmt] = creditors[j]
          const pay = Math.min(-dAmt, cAmt)
          if (pay > 0.005) res.push({ from:dId, to:cId, amount:Math.round(pay*100)/100 })
          debtors[i][1] += pay; creditors[j][1] -= pay
          if (Math.abs(debtors[i][1]) < 1e-9) i++
          if (Math.abs(creditors[j][1]) < 1e-9) j++
        }
        return res
      }
    }
  },
  actions: {
    async refreshRates(base: Currency, symbols: Currency[]) {
      const q = symbols.join(',')
      const resp = await fetch(`/api/fx?base=${base}&symbols=${q}`)
      if (!resp.ok) return
      const data = await resp.json()
      for (const k of Object.keys(data.rates)) {
        this.fx[`${base}->${k}`] = data.rates[k]
        this.fx[`${k}->${base}`] = 1 / data.rates[k]
      }
      this.base = base
      save(this.$state)
    },
    addGroup(name: string, members: PersonId[], currency: Currency) {
      this.groups.push({ id: crypto.randomUUID(), name, members, currency })
      save(this.$state)
    },
    renameGroup(id: string, name: string) {
      const g = this.groups.find(g => g.id === id); if (!g) return
      g.name = name; save(this.$state)
    },
    setMembers(id: string, members: PersonId[]) {
      const g = this.groups.find(g => g.id === id); if (!g) return
      g.members = members; save(this.$state)
    },
    addExpense(e: Omit<Expense,'id'>) {
      this.expenses.push({ ...e, id: crypto.randomUUID() })
      save(this.$state)
    },
    removeExpense(id: string) {
      this.expenses = this.expenses.filter(e => e.id !== id)
      save(this.$state)
    },
    resetAll() {
      this.groups = []; this.expenses = []; save(this.$state)
    }
  }
})