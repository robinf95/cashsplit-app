import { supabase } from '../lib/supabase'

// Database types for better TypeScript support
export interface Group {
  id: string
  user_id: string
  name: string
  currency: string
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
      .select('id, user_id, name, currency, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async createGroup(userId: string, name: string, currency: string = 'EUR'): Promise<string> {
    const { data, error } = await supabase
      .from('groups')
      .insert([{ user_id: userId, name, currency }])
      .select('id')
      .single()
    
    if (error) throw error
    return data.id
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
      .insert([expense])
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
}
