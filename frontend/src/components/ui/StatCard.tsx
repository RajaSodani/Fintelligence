import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  accent?: boolean
  className?: string
}

const changeConfig = {
  up:      { color: 'text-[var(--green)]',  bg: 'bg-[rgba(0,232,122,0.08)]',  Icon: TrendingUp },
  down:    { color: 'text-[var(--red)]',    bg: 'bg-[rgba(255,77,106,0.08)]', Icon: TrendingDown },
  neutral: { color: 'text-[var(--text2)]',  bg: 'bg-[var(--bg4)]',            Icon: Minus },
}

export function StatCard({ label, value, sub, change, changeType = 'neutral', accent = false, className }: StatCardProps) {
  const cfg = changeConfig[changeType]

  return (
    <div
      className={cn(
        'relative rounded-2xl p-5 flex flex-col gap-3 overflow-hidden',
        'border transition-all duration-200 group',
        accent
          ? 'bg-gradient-to-br from-[rgba(0,232,122,0.12)] to-[rgba(0,232,122,0.03)] border-[rgba(0,232,122,0.2)]'
          : 'bg-[var(--bg2)] border-[var(--border2)]',
        'hover:border-[var(--border3)] hover:-translate-y-0.5 shadow-card hover:shadow-card-hover',
        className
      )}
    >
      {/* Top label */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-2xs uppercase tracking-[0.1em] text-[var(--text3)]">
          {label}
        </span>
        {change && (
          <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-2xs font-medium', cfg.color, cfg.bg)}>
            <cfg.Icon size={10} strokeWidth={2.5} />
            {change}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            'num text-[28px]',
            accent ? 'text-[var(--green)]' : 'text-[var(--text)]',
          )}
        >
          {value}
        </span>
        {sub && (
          <span className="font-mono text-xs text-[var(--text3)] mt-1">{sub}</span>
        )}
      </div>

      {/* Accent glow */}
      {accent && (
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-[var(--green)] opacity-[0.06] blur-2xl pointer-events-none" />
      )}
    </div>
  )
}
