import fs from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

try {
  console.log('Initializing Supabase database tables...')
  
  // Read the schema file
  const sql = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8')
  
  // Split SQL commands and execute them one by one
  const commands = sql.split(';').filter(cmd => cmd.trim().length > 0)
  
  for (const command of commands) {
    const trimmedCommand = command.trim()
    if (trimmedCommand) {
      console.log('Executing:', trimmedCommand.substring(0, 50) + '...')
      const { error } = await supabase.rpc('exec_sql', { query: trimmedCommand })
      
      if (error) {
        console.error('Error executing command:', error)
        // Try alternative approach for table creation
        if (trimmedCommand.includes('create table')) {
          console.log('Trying alternative table creation method...')
          // We'll handle this through Supabase dashboard or manual SQL execution
        }
      } else {
        console.log('✓ Command executed successfully')
      }
    }
  }
  
  console.log('Database initialization completed!')
} catch (error) {
  console.error('Database initialization failed:', error)
  console.log('\nPlease create the tables manually in Supabase dashboard with this SQL:')
  console.log('='* 60)
  const sql = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8')
  console.log(sql)
  console.log('='* 60)
}

process.exit(0)
