import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  onNavigate: () => void
}

export function PortfolioBanner({ onNavigate }: Props) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(0,232,122,0.06), rgba(77,159,255,0.04))',
        border: '1px dashed rgba(0,232,122,0.2)',
      }}
    >
      <div className="w-9 h-9 rounded-xl bg-[rgba(0,232,122,0.1)] flex items-center justify-center flex-shrink-0">
        <TrendingUp size={16} className="text-[var(--green)]" />
      </div>
      <div className="flex-1">
        <p className="font-syne font-semibold text-[14px] text-[var(--text)]">Track your investments</p>
        <p className="font-mono text-xs text-[var(--text3)]">Add holdings to see live P&amp;L on the Market page</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onNavigate}>Go to Market</Button>
    </div>
  )
}
