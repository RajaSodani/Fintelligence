import { useEffect, useRef } from 'react'
import { createChart, CandlestickSeries } from 'lightweight-charts'
import type { OHLCPoint } from '@/types'

interface CandlestickChartProps {
  data: OHLCPoint[]
  height?: number
}

export function CandlestickChart({ data, height = 180 }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (!data.length) return

    const chart = createChart(el, {
      autoSize: true,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)', timeVisible: false },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor:         '#00e87a',
      downColor:       '#ff4d6a',
      borderUpColor:   '#00e87a',
      borderDownColor: '#ff4d6a',
      wickUpColor:     '#00e87a',
      wickDownColor:   '#ff4d6a',
    })

    // Upstox returns candles newest-first; lightweight-charts needs ascending order
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
    series.setData(
      sorted.map((d) => ({
        time:  d.date as `${number}-${number}-${number}`,
        open:  d.open,
        high:  d.high,
        low:   d.low,
        close: d.close,
      }))
    )

    chart.timeScale().fitContent()

    return () => { chart.remove() }
  }, [data, height])

  return (
    <div style={{ height }}>
      {data.length === 0
        ? <div className="h-full flex items-center justify-center font-mono text-xs text-[var(--text3)]">No data</div>
        : <div ref={containerRef} style={{ width: '100%', height }} />
      }
    </div>
  )
}
