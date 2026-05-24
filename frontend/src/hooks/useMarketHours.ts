import { useState, useEffect } from 'react'

function checkMarketOpen(): boolean {
  // NSE: 9:15 AM - 3:30 PM IST (UTC+5:30), Monday-Friday
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  if (day === 0 || day === 6) return false
  const mins = ist.getHours() * 60 + ist.getMinutes()
  return mins >= 555 && mins <= 930 // 9:15 = 555, 15:30 = 930
}

export function useMarketHours() {
  const [isMarketOpen, setIsMarketOpen] = useState(checkMarketOpen)

  useEffect(() => {
    const id = setInterval(() => setIsMarketOpen(checkMarketOpen()), 60_000)
    return () => clearInterval(id)
  }, [])

  return { isMarketOpen }
}
