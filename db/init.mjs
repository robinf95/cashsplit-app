import fs from 'node:fs/promises'
import { createPool } from '@vercel/postgres'
const sql = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8')
const pool = createPool()
await pool.query(sql)
console.log('Database initialized')
process.exit(0)