import { supabase } from '../lib/supabase'

// Database types for better TypeScript support
export interface Group {
  id: string
  user_id: string
  name: string
  currency: string
  members: string[]
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  group_id: string
  amount: number
  payer: string
  for_members: string[]
  note?: string
  date: string
  currency?: string
}

// Client-side database operations using Supabase
export class SupabaseService {
  // Groups operations
  static async getGroups(userId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('id, user_id, name, currency, members, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async createGroup(userId: string, name: string, currency: string = 'EUR', members: string[] = []): Promise<string> {
    const { data, error } = await supabase
      .from('groups')
      .insert([{ user_id: userId, name, currency, members }])
      .select('id')
      .single()
    
    if (error) throw error
    return data.id
  }

  static async updateGroup(groupId: string, userId: string, updates: { name?: string; currency?: string }): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .eq('user_id', userId)

    if (error) throw error
  }

  static async deleteGroup(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)
      .eq('user_id', userId)
    
    if (error) throw error
  }

  // Expenses operations
  static async getExpenses(groupId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async createExpense(expense: Omit<Expense, 'id' | 'date'>): Promise<string> {
    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense, date: new Date().toISOString() }])
      .select('id')
      .single()
    
    if (error) throw error
    return data.id
  }

  static async deleteExpense(expenseId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId)
    
    if (error) throw error
  }

  // Real-time subscriptions
  static subscribeToGroupExpenses(groupId: string, callback: (expense: Expense) => void) {
    return supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            callback(payload.new as Expense)
          }
        }
      )
      .subscribe()
  }

  static subscribeToUserGroups(userId: string, callback: (group: Group) => void) {
    return supabase
      .channel(`user-groups-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            callback(payload.new as Group)
          }
        }
      )
      .subscribe()
  }

  // Members operations (assuming members are stored as JSON in groups table or separate table)
  static async updateGroupMembers(groupId: string, userId: string, members: string[]): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .update({ members })
      .eq('id', groupId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Get user ID from current session
  static async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  }

  // Exchange rates storage (if needed)
  static async updateExchangeRates(userId: string, rates: Record<string, number>, base: string): Promise<void> {
    const { error } = await supabase
      .from('user_settings')
      .upsert([{
        user_id: userId,
        exchange_rates: rates,
        base_currency: base,
        updated_at: new Date().toISOString()
      }])

    if (error) throw error
  }

  static async getExchangeRates(userId: string): Promise<{ rates: Record<string, number>; base: string } | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('exchange_rates, base_currency')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ? { rates: data.exchange_rates || {}, base: data.base_currency || 'EUR' } : null
  }
}
