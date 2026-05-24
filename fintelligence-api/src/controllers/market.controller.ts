import type { Request, Response } from 'express'
import { getQuote, getOHLC, getTopMovers, getQuotes, MARKET_STRIP_TICKERS, searchInstruments } from '../services/market.service'

export async function getTickerQuote(req: Request, res: Response): Promise<void> {
  const { ticker } = req.params
  const quote = await getQuote(ticker.toUpperCase())
  res.json(quote)
}

export async function getTickerOHLC(req: Request, res: Response): Promise<void> {
  const { ticker } = req.params
  const range = (req.query.range as string) ?? '1m'
  const data = await getOHLC(ticker.toUpperCase(), range)
  res.json(data)
}

export async function getMarketStrip(_req: Request, res: Response): Promise<void> {
  const quotes = await getQuotes(MARKET_STRIP_TICKERS)
  const result = MARKET_STRIP_TICKERS.map((t) => quotes.get(t)).filter(Boolean)
  res.json(result)
}

export async function getMovers(_req: Request, res: Response): Promise<void> {
  const data = await getTopMovers()
  res.json(data)
}

export async function searchTickers(req: Request, res: Response): Promise<void> {
  const q = (req.query.q as string ?? '').trim()
  const results = await searchInstruments(q)
  res.json(results)
}
