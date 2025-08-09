import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fedgovdtnecuwywkveou.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlZGdvdmR0bmVjdXd5d2t2ZW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NjU5NjMsImV4cCI6MjA3MDI0MTk2M30.0VJu25tU_EoyZxuZnEfgwW05jX8lJZtWawlV3cI_5eE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
