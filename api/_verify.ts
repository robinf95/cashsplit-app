import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Clerk } from '@clerk/clerk-sdk-node'
const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY || '' })
export async function verifyClerk(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) { res.status(401).json({ error: 'missing token' }); return null }
    const session = await clerk.sessions.verifySessionToken(token)
    return { userId: session.userId }
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' }); return null
  }
}