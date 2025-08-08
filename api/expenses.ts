import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pool } from './_db'
import { verifyClerk } from './_verify'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await verifyClerk(req, res); if (!auth) return

  if (req.method === 'GET') {
    const { groupId } = req.query
    const { rows } = await pool.query('select * from expenses where group_id = $1 and user_id = $2 order by date desc', [groupId, auth.userId])
    return res.json(rows)
  }
  if (req.method === 'POST') {
    const { groupId, amount, payer, forMembers, note, date, currency } = req.body
    await pool.query(
      'insert into expenses (id, user_id, group_id, amount, payer, for_members, note, date, currency) values (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)',
      [auth.userId, groupId, amount, payer, forMembers, note ?? null, date ?? new Date(), currency ?? null]
    )
    return res.status(201).json({ ok: true })
  }
  if (req.method === 'DELETE') {
    const { id } = req.query
    await pool.query('delete from expenses where id = $1 and user_id = $2', [id, auth.userId])
    return res.json({ ok: true })
  }
  res.status(405).end()
}