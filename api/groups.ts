import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pool } from './_db'
import { verifyClerk } from './_verify'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyClerk(req, res); if (!auth) return

  if (req.method === 'GET') {
    const { rows } = await pool.query('select id, name, currency from groups where user_id = $1 order by created_at desc', [auth.userId])
    return res.json(rows)
  }
  if (req.method === 'POST') {
    const { name, currency } = req.body || {}
    const r = await pool.query('insert into groups (id, user_id, name, currency) values (gen_random_uuid(), $1, $2, $3) returning id', [auth.userId, name, currency || 'EUR'])
    return res.status(201).json({ id: r.rows[0].id })
  }
  res.status(405).end()
}