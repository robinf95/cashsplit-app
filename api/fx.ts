import type { VercelRequest, VercelResponse } from '@vercel/node'
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const base = String(req.query.base || 'EUR')
  const symbols = String(req.query.symbols || 'EUR,USD,CHF,GBP')
  const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols)}`
  const r = await fetch(url)
  const data = await r.json()
  res.setHeader('Cache-Control', 'public, max-age=3600')
  return res.json({ base: data.base, rates: data.rates, date: data.date })
}