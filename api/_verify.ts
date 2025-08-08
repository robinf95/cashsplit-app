import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyToken } from '@clerk/backend'

export async function verifyClerk(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) { res.status(401).json({ error: 'missing token' }); return null }
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY || '' })
    return { userId: payload.sub }
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' }); return null
  }
}