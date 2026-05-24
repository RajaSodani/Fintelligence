import { useState, useRef } from 'react'
import { X, Upload, AlertTriangle, CheckCircle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { coreApi } from '@/lib/axios'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Holding } from '@/types'

interface ParsedRow {
  ticker: string
  quantity: number
  avgBuyPrice: number
  resolution: 'overwrite' | 'skip' | 'add'
  conflict: boolean
}

function downloadSample() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Ticker', 'Quantity', 'Avg Buy Price'],
    ['RELIANCE', 10, 2800],
    ['TCS', 5, 3500],
    ['INFY', 8, 1450],
    ['HDFCBANK', 15, 1600],
  ])
  ws['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 16 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Holdings')
  XLSX.writeFile(wb, 'holdings_sample.xlsx')
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '')
}

function detectColumn(headers: string[], candidates: string[]): number {
  const norm = headers.map(normalizeKey)
  for (const c of candidates) {
    const idx = norm.indexOf(normalizeKey(c))
    if (idx !== -1) return idx
  }
  return -1
}

function parseSheet(workbook: XLSX.WorkBook): { rows: Omit<ParsedRow, 'resolution' | 'conflict'>[]; error?: string } {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 }) as string[][]

  if (raw.length < 2) return { rows: [], error: 'Sheet is empty or has no data rows' }

  const headers = raw[0].map(String)
  const tickerIdx  = detectColumn(headers, ['ticker', 'symbol', 'stock', 'scrip', 'isin'])
  const qtyIdx     = detectColumn(headers, ['quantity', 'qty', 'shares', 'units', 'no.ofshares'])
  const priceIdx   = detectColumn(headers, ['avgbuyprice', 'avgprice', 'averageprice', 'buyprice', 'purchaseprice', 'cost', 'price'])

  if (tickerIdx === -1 || qtyIdx === -1 || priceIdx === -1) {
    return { rows: [], error: `Could not find required columns. Need: Ticker, Quantity, Avg Buy Price. Found: ${headers.join(', ')}` }
  }

  const rows: Omit<ParsedRow, 'resolution' | 'conflict'>[] = []
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i]
    if (!row || !row[tickerIdx]) continue
    const ticker = String(row[tickerIdx]).trim().toUpperCase()
    const quantity = parseFloat(String(row[qtyIdx] ?? ''))
    const avgBuyPrice = parseFloat(String(row[priceIdx] ?? ''))
    if (!ticker || isNaN(quantity) || isNaN(avgBuyPrice) || quantity <= 0 || avgBuyPrice <= 0) continue
    rows.push({ ticker, quantity, avgBuyPrice })
  }

  return { rows }
}

interface Props {
  existingHoldings: Holding[]
  onClose: () => void
  onImported: () => Promise<void>
}

export function ExcelImportModal({ existingHoldings, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null)
  const existingTickers = new Set(existingHoldings.map((h) => h.ticker))

  const handleFile = (file: File) => {
    setParseError('')
    setRows([])
    setDone(false)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' })
        const { rows: parsed, error } = parseSheet(wb)
        if (error) { setParseError(error); return }
        if (!parsed.length) { setParseError('No valid rows found in the file'); return }
        setRows(parsed.map((r) => ({
          ...r,
          conflict: existingTickers.has(r.ticker),
          resolution: 'overwrite' as const,
        })))
      } catch {
        setParseError('Failed to parse file. Make sure it is a valid .xlsx or .xls file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const { data } = await coreApi.post('/api/v1/portfolio/import', {
        holdings: rows.map(({ ticker, quantity, avgBuyPrice, resolution }) => ({
          ticker, quantity, avgBuyPrice, resolution,
        })),
      })
      await onImported()
      setImportResult({ imported: data.imported })
      setDone(true)
    } catch {
      setParseError('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  const setResolution = (ticker: string, resolution: ParsedRow['resolution']) => {
    setRows((prev) => prev.map((r) => r.ticker === ticker ? { ...r, resolution } : r))
  }

  const conflicts = rows.filter((r) => r.conflict)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(7,9,15,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl w-full max-w-2xl shadow-card max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <p className="font-syne font-bold text-[16px] text-[var(--text)]">Import Holdings from Excel</p>
          <button onClick={onClose} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle size={40} className="text-[var(--green)]" />
              <p className="font-syne font-bold text-[16px] text-[var(--text)]">Import Complete</p>
              <p className="font-mono text-sm text-[var(--text3)]">{importResult?.imported} holding(s) processed</p>
              <Button variant="primary" size="md" onClick={onClose}>Done</Button>
            </div>
          ) : (
            <>
              {/* File upload zone */}
              {!rows.length && (
                <div className="flex flex-col gap-3">
                  <div
                    className="border-2 border-dashed border-[var(--border2)] rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[rgba(0,232,122,0.3)] transition-colors"
                    onClick={() => fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Upload size={32} className="text-[var(--text3)]" />
                    <div className="text-center">
                      <p className="font-dm text-sm text-[var(--text2)]">Drop your Excel file here, or click to browse</p>
                      <p className="font-mono text-xs text-[var(--text3)] mt-1">Supports .xlsx and .xls · Required columns: Ticker, Quantity, Avg Buy Price</p>
                    </div>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                  </div>
                  <button
                    type="button"
                    onClick={downloadSample}
                    className="flex items-center gap-2 mx-auto font-mono text-xs text-[var(--green)] hover:underline transition-colors"
                  >
                    <Download size={13} />
                    Download sample Excel template
                  </button>
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-2 bg-[rgba(255,77,106,0.08)] border border-[rgba(255,77,106,0.25)] rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-[var(--red)] flex-shrink-0 mt-0.5" />
                  <p className="font-mono text-xs text-[var(--red)]">{parseError}</p>
                </div>
              )}

              {rows.length > 0 && (
                <>
                  {conflicts.length > 0 && (
                    <div className="bg-[rgba(255,170,0,0.07)] border border-[rgba(255,170,0,0.2)] rounded-xl px-4 py-3">
                      <p className="font-mono text-xs text-[var(--amber)]">
                        {conflicts.length} ticker(s) already exist in your portfolio. Choose how to handle each conflict below.
                      </p>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          {['Ticker', 'Qty', 'Avg Price', 'Action'].map((col) => (
                            <th key={col} className="px-3 py-2 text-left font-mono text-2xs text-[var(--text3)] uppercase tracking-wider">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.ticker} className={cn('border-b border-[var(--border)]', r.conflict && 'bg-[rgba(255,170,0,0.04)]')}>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[13px] font-medium text-[var(--text)]">{r.ticker}</span>
                                {r.conflict && <span className="font-mono text-2xs text-[var(--amber)] bg-[rgba(255,170,0,0.12)] px-1.5 py-0.5 rounded">exists</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-[13px] text-[var(--text2)]">{r.quantity}</td>
                            <td className="px-3 py-2.5 font-mono text-[13px] text-[var(--text2)]">₹{r.avgBuyPrice.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2.5">
                              {r.conflict ? (
                                <select
                                  value={r.resolution}
                                  onChange={(e) => setResolution(r.ticker, e.target.value as ParsedRow['resolution'])}
                                  className="bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-2 py-1 font-mono text-xs text-[var(--text)] outline-none focus:border-[rgba(0,232,122,0.35)] transition-colors"
                                >
                                  <option value="overwrite">Overwrite</option>
                                  <option value="add">Merge (add qty)</option>
                                  <option value="skip">Skip</option>
                                </select>
                              ) : (
                                <span className="font-mono text-xs text-[var(--green)]">New</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => { setRows([]); setParseError('') }}
                      className="font-mono text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors"
                    >
                      ← Upload a different file
                    </button>
                    <Button variant="primary" size="md" loading={importing} onClick={handleImport}>
                      Import {rows.length} Holding{rows.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
