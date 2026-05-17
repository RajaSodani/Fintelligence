import axios from 'axios'

const UPSTOX_BASE = process.env.UPSTOX_BASE_URL ?? 'https://api.upstox.com/v2'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuoteResult {
  ticker: string
  companyName: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  volume: number
  marketCap: number | null
}

export interface OHLCPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// ─── Instrument key map ───────────────────────────────────────────────────────
// Equities use "NSE_EQ|ISIN"; indices use "NSE_INDEX|name" or "BSE_INDEX|name".

const INSTRUMENT_KEY: Record<string, string> = {
  'NIFTY 50':   'NSE_INDEX|Nifty 50',
  'NIFTYBANK':  'NSE_INDEX|Nifty Bank',
  'SENSEX':     'BSE_INDEX|SENSEX',
  'TCS':        'NSE_EQ|INE467B01029',
  'RELIANCE':   'NSE_EQ|INE002A01018',
  'NTPC':       'NSE_EQ|INE733E01010',
  'INFY':       'NSE_EQ|INE009A01021',
  'HDFCBANK':   'NSE_EQ|INE040A01034',
  'ICICIBANK':  'NSE_EQ|INE090A01021',
  'SBIN':       'NSE_EQ|INE062A01020',
  'WIPRO':      'NSE_EQ|INE075A01022',
  'AXISBANK':   'NSE_EQ|INE238A01034',
  'BAJFINANCE': 'NSE_EQ|INE296A01024',
  'TATAMOTORS': 'NSE_EQ|INE155A01022',
  'LT':         'NSE_EQ|INE018A01030',
  'KOTAKBANK':  'NSE_EQ|INE237A01028',
  'MARUTI':     'NSE_EQ|INE585B01010',
  'TATASTEEL':  'NSE_EQ|INE081A01012',
  'HINDUNILVR': 'NSE_EQ|INE030A01027',
}

// Upstox response keys replace "|" with ":".
// For equities: "NSE_EQ:SYMBOL" — symbol matches the ticker.
// For indices:  "NSE_INDEX:Nifty 50", "BSE_INDEX:SENSEX" — mirrors the key name.
const RESP_KEY_TO_TICKER: Record<string, string> = (() => {
  const m: Record<string, string> = {}
  for (const [ticker, ikey] of Object.entries(INSTRUMENT_KEY)) {
    const [exchange] = ikey.split('|')
    if (exchange.endsWith('_EQ')) {
      m[`${exchange}:${ticker}`] = ticker
    } else {
      m[ikey.replace('|', ':')] = ticker
    }
  }
  return m
})()

// ─── HTTP client ──────────────────────────────────────────────────────────────

function upstoxHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN ?? ''}`,
    Accept: 'application/json',
  }
}

async function upstoxGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = `${UPSTOX_BASE}${path}`
  console.log('[upstox] GET', url, params ?? '')
  const { data } = await axios.get<{ status: string; data: T }>(
    url,
    { headers: upstoxHeaders(), params, timeout: 10_000 }
  )
  if (data.status !== 'success') throw new Error(`Upstox error: ${JSON.stringify(data)}`)
  return data.data
}

// ─── TTL cache with stale fallback ───────────────────────────────────────────

class TTLCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>()
  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const e = this.store.get(key)
    if (!e || Date.now() > e.expiresAt) return undefined
    return e.value
  }

  getStale(key: string): T | undefined {
    return this.store.get(key)?.value
  }

  set(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}

const quoteCache      = new TTLCache<QuoteResult>(2 * 60_000)
const historicalCache = new TTLCache<OHLCPoint[]>(15 * 60_000)

// ─── In-flight dedup ──────────────────────────────────────────────────────────

const inFlight = new Map<string, Promise<unknown>>()

function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key)
  if (existing) return existing as Promise<T>
  const p = fn().finally(() => inFlight.delete(key))
  inFlight.set(key, p)
  return p
}

// ─── Quote parsing ────────────────────────────────────────────────────────────

type RawEntry = {
  last_price?: number
  net_change?: number
  ohlc?: { open?: number; high?: number; low?: number; close?: number }
  volume?: number
  symbol?: string
}

function parseQuoteEntry(ticker: string, entry: RawEntry): QuoteResult {
  const price     = entry.last_price ?? 0
  const change    = entry.net_change ?? 0
  const prevClose = price - change
  const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0
  const ohlc      = entry.ohlc ?? {}

  return {
    ticker,
    companyName:   entry.symbol ?? ticker,
    price,
    change,
    changePercent: changePct,
    open:      ohlc.open   ?? 0,
    high:      ohlc.high   ?? 0,
    low:       ohlc.low    ?? 0,
    volume:    entry.volume ?? 0,
    marketCap: null,
  }
}

// ─── Quote fetch ──────────────────────────────────────────────────────────────

async function fetchQuotes(tickers: string[]): Promise<Map<string, QuoteResult>> {
  const result  = new Map<string, QuoteResult>()
  const missing: string[] = []

  for (const ticker of tickers) {
    const cached = quoteCache.get(ticker)
    if (cached) result.set(ticker, cached)
    else missing.push(ticker)
  }

  if (!missing.length) return result

  const ikeys = missing
    .map(t => INSTRUMENT_KEY[t.toUpperCase()])
    .filter((k): k is string => Boolean(k))

  if (!ikeys.length) return result

  const dedupeKey = ikeys.join(',')

  const fresh = await dedupe(dedupeKey, async () => {
    const fetched = new Map<string, QuoteResult>()
    try {
      const raw = await upstoxGet<Record<string, RawEntry>>(
        '/market-quote/quotes',
        { instrument_key: ikeys.join(',') }
      )
      for (const [respKey, entry] of Object.entries(raw)) {
        const ticker = RESP_KEY_TO_TICKER[respKey]
        if (!ticker) continue
        const q = parseQuoteEntry(ticker, entry)
        quoteCache.set(ticker, q)
        fetched.set(ticker, q)
      }
    } catch (err: unknown) {
      console.error('[market] Upstox quote error:', err instanceof Error ? err.message : err)
      for (const ticker of missing) {
        const stale = quoteCache.getStale(ticker)
        if (stale) fetched.set(ticker, stale)
      }
    }
    return fetched
  })

  for (const [k, v] of fresh) result.set(k, v)
  return result
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getQuote(ticker: string): Promise<QuoteResult> {
  const map = await fetchQuotes([ticker])
  const q   = map.get(ticker)
  if (!q) throw new Error(`No data for ${ticker}`)
  return q
}

export async function getQuotes(tickers: string[]): Promise<Map<string, QuoteResult>> {
  return fetchQuotes(tickers)
}

// ─── Historical OHLC ─────────────────────────────────────────────────────────
// Historical candle format: [timestamp, open, high, low, close, volume, oi]

const RANGE_DAYS: Record<string, number> = {
  '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365,
}

export async function getOHLC(ticker: string, range: string): Promise<OHLCPoint[]> {
  const cacheKey = `${ticker}:${range}`
  const cached   = historicalCache.get(cacheKey)
  if (cached) return cached

  return dedupe(cacheKey, async () => {
    try {
      const ikey = INSTRUMENT_KEY[ticker.toUpperCase()]
      if (!ikey) throw new Error(`Unknown ticker: ${ticker}`)

      const days     = RANGE_DAYS[range] ?? 30
      const today    = new Date()
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)

      const toStr   = today.toISOString().slice(0, 10)
      const fromStr = fromDate.toISOString().slice(0, 10)

      const encoded = encodeURIComponent(ikey)
      const raw = await upstoxGet<{ candles: unknown[][] }>(
        `/historical-candle/${encoded}/day/${toStr}/${fromStr}`
      )

      const points: OHLCPoint[] = raw.candles.map((c) => ({
        date:   (c[0] as string).slice(0, 10),
        open:   c[1] as number,
        high:   c[2] as number,
        low:    c[3] as number,
        close:  c[4] as number,
        volume: c[5] as number,
      }))

      historicalCache.set(cacheKey, points)
      return points
    } catch (err: unknown) {
      console.error(`[market] Upstox historical error for ${ticker}:`, err instanceof Error ? err.message : err)
      return historicalCache.getStale(cacheKey) ?? []
    }
  })
}

export async function getSparkline(ticker: string): Promise<number[]> {
  try {
    const data = await getOHLC(ticker, '1w')
    return data.map((d) => d.close).slice(-7)
  } catch {
    return []
  }
}

// ─── Market strip ─────────────────────────────────────────────────────────────

export const MARKET_STRIP_TICKERS = ['NIFTY 50', 'SENSEX', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK']

// ─── Top movers ───────────────────────────────────────────────────────────────

const UNIVERSE = [
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
  'BAJFINANCE', 'HINDUNILVR', 'KOTAKBANK', 'LT', 'AXISBANK',
  'SBIN', 'WIPRO', 'TATAMOTORS', 'TATASTEEL', 'MARUTI',
]

export async function getTopMovers(): Promise<{ gainers: QuoteResult[]; losers: QuoteResult[] }> {
  const quotes = await getQuotes(UNIVERSE)
  const list   = Array.from(quotes.values()).sort((a, b) => b.changePercent - a.changePercent)
  return {
    gainers: list.slice(0, 5),
    losers:  list.slice(-5).reverse(),
  }
}
