import { defineStore } from 'pinia'
import { SupabaseService } from '../lib/supabase-service'

export type Currency = 'EUR' | 'USD' | 'CHF' | 'GBP'
export type PersonId = string

// Updated types to match Supabase schema
export type Group = {
  id: string
  name: string
  members: PersonId[]
  currency: Currency
  user_id?: string
  created_at?: string
}

export type Expense = {
  id: string
  groupId: string
  payer: PersonId
  for: PersonId[]
  amount: number
  note?: string
  date: string
  currency?: Currency
  user_id?: string
}

type State = {
  groups: Group[]
  expenses: Expense[]
  fx: Record<string, number>
  base: Currency
  currentUserId: string | null
  loading: boolean
}

export const useExpenseStore = defineStore('expenses', {
  state: (): State => ({
    groups: [],
    expenses: [],
    fx: {},
    base: 'EUR',
    currentUserId: null,
    loading: false
  }),

  getters: {
    groupById: (s) => (id: string) => s.groups.find(g => g.id === id),
    balances: (s) => (groupId: string) => {
      const g = s.groups.find(g => g.id === groupId)
      if (!g) return {}

      const bal: Record<string, number> = {}
      g.members.forEach(m => bal[m] = 0)

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
          const [dId, dAmt] = debtors[i]
          const [cId, cAmt] = creditors[j]
          const pay = Math.min(-dAmt, cAmt)
          if (pay > 0.005) res.push({ from:dId, to:cId, amount:Math.round(pay*100)/100 })
          debtors[i][1] += pay
          creditors[j][1] -= pay
          if (Math.abs(debtors[i][1]) < 1e-9) i++
          if (Math.abs(creditors[j][1]) < 1e-9) j++
        }
        return res
      }
    }
  },

  actions: {
    async initialize() {
      this.loading = true
      try {
        // Get current user ID (from Clerk or Supabase auth)
        this.currentUserId = await this.getCurrentUserId()

        if (this.currentUserId) {
          // Load user data from Supabase
          await this.loadUserData()
        } else {
          console.log('No authenticated user found, using empty state')
          // Initialize with demo data if no user is authenticated
          this.groups = [{
            id: 'demo',
            name: 'Beispielgruppe',
            members: ['Alice', 'Bob', 'Clara'],
            currency: 'EUR'
          }]
          this.expenses = []
          this.fx = {}
          this.base = 'EUR'
        }
      } catch (error) {
        console.error('Failed to initialize store:', error)
        // Fallback to demo data on error
        this.groups = [{
          id: 'demo',
          name: 'Beispielgruppe',
          members: ['Alice', 'Bob', 'Clara'],
          currency: 'EUR'
        }]
        this.expenses = []
        this.fx = {}
        this.base = 'EUR'
      } finally {
        this.loading = false
      }
    },

    async getCurrentUserId(): Promise<string | null> {
      try {
        // First try to get from Clerk
        const clerk = (window as any).Clerk
        if (clerk?.loaded && clerk?.user?.id) {
          console.log('Found Clerk user:', clerk.user.id)
          return clerk.user.id
        }

        // Fallback to Supabase auth
        const userId = await SupabaseService.getCurrentUserId()
        if (userId) {
          console.log('Found Supabase user:', userId)
          return userId
        }

        console.log('No authenticated user found')
        return null
      } catch (error) {
        console.error('Error getting user ID:', error)
        return null
      }
    },

    async loadUserData() {
      if (!this.currentUserId) return

      try {
        // Load groups
        const supabaseGroups = await SupabaseService.getGroups(this.currentUserId)
        this.groups = supabaseGroups.map(g => ({
          id: g.id,
          name: g.name,
          currency: g.currency as Currency,
          members: g.members || [], // Now properly handled from database
          user_id: g.user_id,
          created_at: g.created_at
        }))

        // Load expenses for all groups
        this.expenses = []
        for (const group of this.groups) {
          const groupExpenses = await SupabaseService.getExpenses(group.id)
          this.expenses.push(...groupExpenses.map(e => ({
            id: e.id,
            groupId: e.group_id,
            payer: e.payer,
            for: e.for_members,
            amount: e.amount,
            note: e.note,
            date: e.date,
            currency: e.currency as Currency,
            user_id: e.user_id
          })))
        }

        // Load exchange rates
        const ratesData = await SupabaseService.getExchangeRates(this.currentUserId)
        if (ratesData) {
          this.fx = ratesData.rates
          this.base = ratesData.base as Currency
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    },

    async refreshRates(base: Currency, symbols: Currency[]) {
      try {
        console.log(`Fetching exchange rates for ${base} -> ${symbols.join(', ')}`)

        // Use Hexarate API for each currency pair
        for (const target of symbols) {
          if (target === base) {
            // Same currency, rate is 1
            this.fx[`${base}->${target}`] = 1
            this.fx[`${target}->${base}`] = 1
            continue
          }

          try {
            const apiUrl = `https://hexarate.paikama.co/api/rates/latest/${base}?target=${target}`
            const resp = await fetch(apiUrl)

            if (resp.ok) {
              const result = await resp.json()
              if (result.status_code === 200 && result.data?.mid) {
                const rate = result.data.mid
                this.fx[`${base}->${target}`] = rate
                this.fx[`${target}->${base}`] = 1 / rate
                console.log(`✓ ${base}/${target}: ${rate}`)
              }
            } else {
              console.warn(`Failed to fetch ${base}/${target} rate: ${resp.status}`)
            }
          } catch (error) {
            console.warn(`Error fetching ${base}/${target} rate:`, error)
          }
        }

        this.base = base
        console.log('Exchange rates updated successfully from Hexarate API')

        // Save to Supabase
        if (this.currentUserId) {
          try {
            await SupabaseService.updateExchangeRates(this.currentUserId, this.fx, base)
          } catch (error) {
            console.error('Failed to save exchange rates:', error)
          }
        }

        // If we didn't get any rates, fall back to static rates
        const hasAnyRates = symbols.some(symbol => this.fx[`${base}->${symbol}`] !== undefined)
        if (!hasAnyRates) {
          console.warn('No exchange rates were fetched, using fallback rates')
          this.setFallbackRates(base, symbols)
        }

      } catch (error) {
        console.error('Failed to fetch exchange rates:', error)
        this.setFallbackRates(base, symbols)
      }
    },

    setFallbackRates(base: Currency, symbols: Currency[]) {
      // Fallback exchange rates (approximate values)
      const fallbackRates: Record<string, Record<string, number>> = {
        EUR: { EUR: 1, USD: 1.09, CHF: 0.94, GBP: 0.84 },
        USD: { EUR: 0.92, USD: 1, CHF: 0.86, GBP: 0.77 },
        CHF: { EUR: 1.06, USD: 1.16, CHF: 1, GBP: 0.89 },
        GBP: { EUR: 1.19, USD: 1.30, CHF: 1.12, GBP: 1 }
      }

      if (fallbackRates[base]) {
        for (const symbol of symbols) {
          if (fallbackRates[base][symbol]) {
            this.fx[`${base}->${symbol}`] = fallbackRates[base][symbol]
            this.fx[`${symbol}->${base}`] = 1 / fallbackRates[base][symbol]
          }
        }
        this.base = base
        console.log('Using fallback exchange rates')
      }
    },

    async addGroup(name: string, members: PersonId[], currency: Currency) {
      if (!this.currentUserId) throw new Error('User not authenticated')

      try {
        // Create group with members in one call
        const groupId = await SupabaseService.createGroup(this.currentUserId, name, currency, members)

        // Add to local state
        this.groups.push({
          id: groupId,
          name,
          members,
          currency,
          user_id: this.currentUserId,
          created_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Failed to add group:', error)
        throw error
      }
    },

    async renameGroup(id: string, name: string) {
      if (!this.currentUserId) throw new Error('User not authenticated')

      try {
        await SupabaseService.updateGroup(id, this.currentUserId, { name })

        const g = this.groups.find(g => g.id === id)
        if (g) g.name = name
      } catch (error) {
        console.error('Failed to rename group:', error)
        throw error
      }
    },

    async setMembers(id: string, members: PersonId[]) {
      if (!this.currentUserId) throw new Error('User not authenticated')

      try {
        await SupabaseService.updateGroupMembers(id, this.currentUserId, members)

        const g = this.groups.find(g => g.id === id)
        if (g) g.members = members
      } catch (error) {
        console.error('Failed to update members:', error)
        throw error
      }
    },

    async deleteGroup(id: string) {
      if (!this.currentUserId) throw new Error('User not authenticated')

      try {
        await SupabaseService.deleteGroup(id, this.currentUserId)

        // Remove group and its expenses from local state
        this.groups = this.groups.filter(g => g.id !== id)
        this.expenses = this.expenses.filter(e => e.groupId !== id)
      } catch (error) {
        console.error('Failed to delete group:', error)
        throw error
      }
    },

    async addExpense(e: Omit<Expense,'id'>) {
      if (!this.currentUserId) throw new Error('User not authenticated')

      try {
        const expenseData = {
          user_id: this.currentUserId,
          group_id: e.groupId,
          amount: e.amount,
          payer: e.payer,
          for_members: e.for,
          note: e.note,
          currency: e.currency
        }

        const expenseId = await SupabaseService.createExpense(expenseData)

        // Add to local state
        this.expenses.push({
          ...e,
          id: expenseId,
          date: new Date().toISOString(),
          user_id: this.currentUserId
        })
      } catch (error) {
        console.error('Failed to add expense:', error)
        throw error
      }
    },

    async removeExpense(id: string) {
      if (!this.currentUserId) throw new Error('User not authenticated')

      try {
        await SupabaseService.deleteExpense(id, this.currentUserId)
        this.expenses = this.expenses.filter(e => e.id !== id)
      } catch (error) {
        console.error('Failed to remove expense:', error)
        throw error
      }
    },

    async resetAll() {
      if (!this.currentUserId) throw new Error('User not authenticated')

      try {
        // Delete all groups (expenses will be cascade deleted)
        for (const group of this.groups) {
          await SupabaseService.deleteGroup(group.id, this.currentUserId)
        }

        this.groups = []
        this.expenses = []
      } catch (error) {
        console.error('Failed to reset all data:', error)
        throw error
      }
    }
  }
})