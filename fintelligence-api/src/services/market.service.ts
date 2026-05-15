import axios from 'axios'

// ─── Dhan API client ──────────────────────────────────────────────────────────

const dhan = axios.create({
  baseURL: 'https://api.dhan.co/v2',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'access-token': process.env.DHAN_ACCESS_TOKEN ?? '',
    'client-id':    process.env.DHAN_CLIENT_ID ?? '',
  },
})

// ─── Rate-limit queue ─────────────────────────────────────────────────────────

let lastRequestAt    = 0
let rateLimitedUntil = 0

const requestQueue: Array<() => void> = []
let queueRunning = false

function processQueue() {
  if (requestQueue.length === 0) { queueRunning = false; return }
  const next = requestQueue.shift()!
  const wait = Math.max(0, lastRequestAt + 250 - Date.now())
  setTimeout(() => { lastRequestAt = Date.now(); next(); processQueue() }, wait)
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestQueue.push(() => fn().then(resolve, reject))
    if (!queueRunning) { queueRunning = true; processQueue() }
  })
}

// ─── TTL cache with stale-read support ───────────────────────────────────────

class TTLCache<T> {
  private store = new Map<string, { value: T; expiresAt: number }>()
  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry || Date.now() > entry.expiresAt) return undefined
    return entry.value
  }

  getStale(key: string): T | undefined {
    return this.store.get(key)?.value
  }

  set(key: string, value: T) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}

// ─── In-flight deduplication ──────────────────────────────────────────────────

const inFlight = new Map<string, Promise<unknown>>()

function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key)
  if (existing) return existing as Promise<T>
  const p = fn().finally(() => inFlight.delete(key))
  inFlight.set(key, p)
  return p
}

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

// ─── Instrument lookup ────────────────────────────────────────────────────────

interface Instrument {
  securityId: number
  segment: 'NSE_EQ' | 'BSE_EQ' | 'IDX_I'
  name: string
}

// Well-known instruments pre-seeded so the app works without waiting for the scrip master
const INSTRUMENTS: Record<string, Instrument> = {
  'NIFTY 50':  { securityId: 13,    segment: 'IDX_I', name: 'NIFTY 50' },
  'SENSEX':    { securityId: 51,    segment: 'IDX_I', name: 'S&P BSE SENSEX' },
  'NIFTYBANK': { securityId: 25,    segment: 'IDX_I', name: 'NIFTY BANK' },
  'RELIANCE':  { securityId: 2885,  segment: 'NSE_EQ', name: 'Reliance Industries' },
  'TCS':       { securityId: 11536, segment: 'NSE_EQ', name: 'Tata Consultancy Services' },
  'INFY':      { securityId: 1594,  segment: 'NSE_EQ', name: 'Infosys' },
  'HDFCBANK':  { securityId: 1333,  segment: 'NSE_EQ', name: 'HDFC Bank' },
  'ICICIBANK': { securityId: 4963,  segment: 'NSE_EQ', name: 'ICICI Bank' },
  'BAJFINANCE':{ securityId: 317,   segment: 'NSE_EQ', name: 'Bajaj Finance' },
  'SBIN':      { securityId: 3045,  segment: 'NSE_EQ', name: 'State Bank of India' },
  'WIPRO':     { securityId: 3787,  segment: 'NSE_EQ', name: 'Wipro' },
  'AXISBANK':  { securityId: 5900,  segment: 'NSE_EQ', name: 'Axis Bank' },
  'LT':        { securityId: 11483, segment: 'NSE_EQ', name: 'Larsen & Toubro' },
  'KOTAKBANK': { securityId: 1922,  segment: 'NSE_EQ', name: 'Kotak Mahindra Bank' },
  'HINDUNILVR':{ securityId: 1394,  segment: 'NSE_EQ', name: 'Hindustan Unilever' },
  'TATAMOTORS':{ securityId: 3456,  segment: 'NSE_EQ', name: 'Tata Motors' },
  'TATASTEEL': { securityId: 3499,  segment: 'NSE_EQ', name: 'Tata Steel' },
  'MARUTI':    { securityId: 10999, segment: 'NSE_EQ', name: 'Maruti Suzuki' },
  'SUNPHARMA': { securityId: 3351,  segment: 'NSE_EQ', name: 'Sun Pharmaceutical' },
  'ULTRACEMCO':{ securityId: 11532, segment: 'NSE_EQ', name: 'UltraTech Cement' },
  'ASIANPAINT':{ securityId: 236,   segment: 'NSE_EQ', name: 'Asian Paints' },
  'TITAN':     { securityId: 3506,  segment: 'NSE_EQ', name: 'Titan Company' },
  'ITC':       { securityId: 1660,  segment: 'NSE_EQ', name: 'ITC' },
  'NTPC':      { securityId: 11630, segment: 'NSE_EQ', name: 'NTPC' },
  'POWERGRID': { securityId: 14977, segment: 'NSE_EQ', name: 'Power Grid Corporation' },
  'ONGC':      { securityId: 11723, segment: 'NSE_EQ', name: 'Oil & Natural Gas Corp' },
  'COALINDIA': { securityId: 1333,  segment: 'NSE_EQ', name: 'Coal India' },
  'ADANIENT':  { securityId: 25,    segment: 'NSE_EQ', name: 'Adani Enterprises' },
  'ADANIPORTS':{ securityId: 15083, segment: 'NSE_EQ', name: 'Adani Ports & SEZ' },
  'BAJAJFINSV':{ securityId: 16675, segment: 'NSE_EQ', name: 'Bajaj Finserv' },
  'BHARTIARTL':{ securityId: 10604, segment: 'NSE_EQ', name: 'Bharti Airtel' },
  'HCLTECH':   { securityId: 7229,  segment: 'NSE_EQ', name: 'HCL Technologies' },
  'TECHM':     { securityId: 13538, segment: 'NSE_EQ', name: 'Tech Mahindra' },
  'NESTLEIND': { securityId: 17963, segment: 'NSE_EQ', name: 'Nestle India' },
  'DIVISLAB':  { securityId: 10940, segment: 'NSE_EQ', name: "Divi's Laboratories" },
  'DRREDDY':   { securityId: 881,   segment: 'NSE_EQ', name: "Dr. Reddy's Laboratories" },
  'CIPLA':     { securityId: 694,   segment: 'NSE_EQ', name: 'Cipla' },
  'APOLLOHOSP':{ securityId: 157,   segment: 'NSE_EQ', name: 'Apollo Hospitals' },
  'EICHERMOT': { securityId: 910,   segment: 'NSE_EQ', name: 'Eicher Motors' },
  'M&M':       { securityId: 2031,  segment: 'NSE_EQ', name: 'Mahindra & Mahindra' },
  'TATACONSUM':{ securityId: 3432,  segment: 'NSE_EQ', name: 'Tata Consumer Products' },
  'BRITANNIA': { securityId: 547,   segment: 'NSE_EQ', name: 'Britannia Industries' },
  'GRASIM':    { securityId: 1232,  segment: 'NSE_EQ', name: 'Grasim Industries' },
  'JSWSTEEL':  { securityId: 11723, segment: 'NSE_EQ', name: 'JSW Steel' },
  'HINDALCO':  { securityId: 1375,  segment: 'NSE_EQ', name: 'Hindalco Industries' },
  'BPCL':      { securityId: 526,   segment: 'NSE_EQ', name: 'Bharat Petroleum Corp' },
  'IOC':       { securityId: 1624,  segment: 'NSE_EQ', name: 'Indian Oil Corporation' },
  'HEROMOTOCO':{ securityId: 1348,  segment: 'NSE_EQ', name: 'Hero MotoCorp' },
  'INDUSINDBK':{ securityId: 5258,  segment: 'NSE_EQ', name: 'IndusInd Bank' },
}

// ─── Dynamic scrip master ─────────────────────────────────────────────────────
// Downloads Dhan's full instrument list so any NSE/BSE equity can be resolved
// without needing to be in the static map above.

let dynamicMap: Map<string, Instrument> | null = null
let scripLoadPromise: Promise<void> | null = null

function loadScripMaster(): Promise<void> {
  if (dynamicMap !== null) return Promise.resolve()
  if (scripLoadPromise) return scripLoadPromise

  scripLoadPromise = (async () => {
    try {
      console.log('[market] Downloading Dhan scrip master...')
      const res = await axios.get('https://images.dhan.co/api-data/api-scrip-master.csv', {
        timeout: 30_000,
        responseType: 'text',
      })

      const map = new Map<string, Instrument>()
      const lines = (res.data as string).split('\n')
      if (lines.length < 2) throw new Error('Empty scrip master')

      const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      const col = (name: string) => header.indexOf(name)

      const iExch   = col('SEM_EXM_EXCH_ID')
      const iInstr  = col('SEM_INSTRUMENT_NAME')
      const iSymbol = col('SEM_TRADING_SYMBOL')
      const iSecId  = col('SEM_SMST_SECURITY_ID')
      const iName   = col('SM_SYMBOL_NAME')

      if ([iExch, iInstr, iSymbol, iSecId].some((i) => i === -1)) {
        throw new Error(`Unexpected scrip master columns: ${header.join(', ')}`)
      }

      for (let i = 1; i < lines.length; i++) {
        const raw  = lines[i]
        if (!raw.trim()) continue
        const cols = raw.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))

        const exch   = cols[iExch]
        const instr  = cols[iInstr]
        const symbol = cols[iSymbol]?.toUpperCase()
        const secId  = parseInt(cols[iSecId])
        const name   = (iName !== -1 ? cols[iName] : '') || symbol

        if (!symbol || !secId || isNaN(secId)) continue
        if (instr !== 'EQUITY') continue
        if (exch !== 'NSE' && exch !== 'BSE') continue

        const segment = exch === 'NSE' ? 'NSE_EQ' : 'BSE_EQ'

        // Prefer NSE over BSE when symbol appears on both
        if (!map.has(symbol) || exch === 'NSE') {
          map.set(symbol, { securityId: secId, segment, name })
        }
      }

      dynamicMap = map
      console.log(`[market] Scrip master ready — ${map.size} equity instruments`)
    } catch (err: any) {
      console.error('[market] Scrip master load failed:', err.message)
      dynamicMap = new Map() // Prevent retrying on every request
    }
  })()

  return scripLoadPromise
}

// Start loading at startup so it's ready before the first request
loadScripMaster()

async function resolveInstrument(ticker: string): Promise<Instrument | null> {
  const clean = ticker.toUpperCase().trim()

  // Indices live only in the static map — scrip master doesn't have them as equities
  if (INSTRUMENTS[clean]?.segment === 'IDX_I') return INSTRUMENTS[clean]

  // Scrip master is authoritative for NSE/BSE equities — prefer it over hardcoded IDs
  await loadScripMaster()
  if (dynamicMap?.has(clean)) return dynamicMap.get(clean)!

  // Fall back to static map (covers the window before scrip master finishes loading)
  return INSTRUMENTS[clean] ?? null
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── OHLC feed ────────────────────────────────────────────────────────────────

interface DhanOHLCEntry {
  last_price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  previous_close: number
}

// Per-security cache so any batch that fetches TCS satisfies later single-ticker requests
const securityCache = new TTLCache<DhanOHLCEntry>(2 * 60_000)

async function fetchOHLCFeed(instruments: Instrument[]): Promise<Map<number, DhanOHLCEntry>> {
  const result  = new Map<number, DhanOHLCEntry>()
  const missing: Instrument[] = []

  for (const inst of instruments) {
    const key    = `${inst.segment}:${inst.securityId}`
    const cached = securityCache.get(key)
    if (cached) {
      result.set(inst.securityId, cached)
    } else {
      missing.push(inst)
    }
  }

  if (!missing.length) return result

  if (Date.now() < rateLimitedUntil) {
    const secs = Math.ceil((rateLimitedUntil - Date.now()) / 1000)
    console.warn(`[market] rate-limit backoff ${secs}s — serving stale data`)
    for (const inst of missing) {
      const stale = securityCache.getStale(`${inst.segment}:${inst.securityId}`)
      if (stale) result.set(inst.securityId, stale)
    }
    return result
  }

  const bySegment: Record<string, number[]> = {}
  for (const inst of missing) {
    if (!bySegment[inst.segment]) bySegment[inst.segment] = []
    bySegment[inst.segment].push(inst.securityId)
  }

  const dedupeKey = JSON.stringify(bySegment)
  const fresh = await dedupe(dedupeKey, () => enqueue(async () => {
    const fetched = new Map<number, DhanOHLCEntry>()
    try {
      const { data } = await dhan.post('/marketfeed/ohlc', bySegment)
      if (data?.status === 'success') {
        for (const [, entries] of Object.entries(data.data as Record<string, Record<string, DhanOHLCEntry>>)) {
          for (const [id, entry] of Object.entries(entries)) {
            fetched.set(parseInt(id), entry)
          }
        }
        for (const inst of missing) {
          const entry = fetched.get(inst.securityId)
          if (entry) securityCache.set(`${inst.segment}:${inst.securityId}`, entry)
        }
      }
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 429) {
        rateLimitedUntil = Date.now() + 60_000
        console.warn('[market] 429 from Dhan — backing off 60 s, serving stale')
      } else if (status === 401) {
        rateLimitedUntil = Date.now() + 5 * 60_000
        console.error('[market] 401 from Dhan — access token invalid. Regenerate DHAN_ACCESS_TOKEN in .env')
      } else {
        throw err
      }
      for (const inst of missing) {
        const stale = securityCache.getStale(`${inst.segment}:${inst.securityId}`)
        if (stale) fetched.set(inst.securityId, stale)
      }
    }
    return fetched
  }))

  for (const [id, entry] of fresh) result.set(id, entry)
  return result
}

// ─── Price helpers ────────────────────────────────────────────────────────────
// last_price is 0 pre-market / on some non-trading days; fall back to close.

function effectivePrice(entry: DhanOHLCEntry): number {
  return entry.last_price || entry.close || entry.previous_close
}

function buildQuote(ticker: string, inst: Instrument, entry: DhanOHLCEntry): QuoteResult {
  const price     = effectivePrice(entry)
  const prevClose = entry.previous_close || entry.close
  const change    = prevClose > 0 ? price - prevClose : 0
  const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0
  return {
    ticker,
    companyName: inst.name,
    price,
    change,
    changePercent: changePct,
    open:      entry.open,
    high:      entry.high,
    low:       entry.low,
    volume:    entry.volume,
    marketCap: null,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getQuote(ticker: string): Promise<QuoteResult> {
  const inst = await resolveInstrument(ticker)
  if (!inst) throw new Error(`Unknown ticker: ${ticker}`)

  const feed  = await fetchOHLCFeed([inst])
  const entry = feed.get(inst.securityId)
  if (!entry) throw new Error(`No data returned for ${ticker}`)

  return buildQuote(ticker, inst, entry)
}

export async function getQuotes(tickers: string[]): Promise<Map<string, QuoteResult>> {
  const results = new Map<string, QuoteResult>()
  if (!tickers.length) return results

  const pairs: { ticker: string; inst: Instrument }[] = []
  for (const ticker of tickers) {
    const inst = await resolveInstrument(ticker)
    if (inst) pairs.push({ ticker, inst })
    else console.warn(`[market] No instrument mapping for ticker: ${ticker}`)
  }
  if (!pairs.length) return results

  const feed = await fetchOHLCFeed(pairs.map((p) => p.inst))

  for (const { ticker, inst } of pairs) {
    const entry = feed.get(inst.securityId)
    if (!entry) continue
    results.set(ticker, buildQuote(ticker, inst, entry))
  }

  return results
}

// ─── Historical / OHLC chart ──────────────────────────────────────────────────

const RANGE_MAP: Record<string, { from: string }> = {
  '1w': { from: daysAgo(7)   },
  '1m': { from: daysAgo(30)  },
  '3m': { from: daysAgo(90)  },
  '6m': { from: daysAgo(180) },
  '1y': { from: daysAgo(365) },
}

const historicalCache = new TTLCache<OHLCPoint[]>(15 * 60_000)

export async function getOHLC(ticker: string, range: string): Promise<OHLCPoint[]> {
  const inst = await resolveInstrument(ticker)
  if (!inst) return []

  const { from } = RANGE_MAP[range] ?? RANGE_MAP['1m']
  const cacheKey = `${ticker}:${range}:${from}`
  const cached   = historicalCache.get(cacheKey)
  if (cached) return cached

  if (Date.now() < rateLimitedUntil) {
    return historicalCache.getStale(cacheKey) ?? []
  }

  return dedupe(cacheKey, () => enqueue(async () => {
    try {
      const instrumentType = inst.segment === 'IDX_I' ? 'INDEX' : 'EQUITY'
      const { data } = await dhan.post('/charts/historical', {
        securityId:      String(inst.securityId),
        exchangeSegment: inst.segment,
        instrument:      instrumentType,
        fromDate:        from,
        toDate:          today(),
      })

      if (!data?.open) return historicalCache.getStale(cacheKey) ?? []

      const { open, high, low, close, volume, timestamp } = data as {
        open: number[]; high: number[]; low: number[]; close: number[]
        volume: number[]; timestamp: number[]
      }

      const points = timestamp.map((ts, i) => ({
        date:   new Date(ts * 1000).toISOString().slice(0, 10),
        open:   open[i]   ?? 0,
        high:   high[i]   ?? 0,
        low:    low[i]    ?? 0,
        close:  close[i]  ?? 0,
        volume: volume[i] ?? 0,
      }))

      historicalCache.set(cacheKey, points)
      return points
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 429) {
        rateLimitedUntil = Date.now() + 60_000
        console.warn('[market] 429 from Dhan historical — backing off 60 s')
      } else if (status === 401) {
        rateLimitedUntil = Date.now() + 5 * 60_000
        console.error('[market] 401 from Dhan — access token invalid')
      } else {
        throw err
      }
      return historicalCache.getStale(cacheKey) ?? []
    }
  }))
}

export async function getSparkline(ticker: string): Promise<number[]> {
  try {
    const data = await getOHLC(ticker, '1w')
    return data.map((d) => d.close).slice(-7)
  } catch {
    return []
  }
}

// ─── Market strip tickers ─────────────────────────────────────────────────────

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
