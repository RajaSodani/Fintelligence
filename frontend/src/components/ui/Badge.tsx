import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'muted'
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses = {
  green:  'bg-[rgba(0,232,122,0.1)]  text-[var(--green)]  border border-[rgba(0,232,122,0.25)]',
  amber:  'bg-[rgba(245,166,35,0.1)] text-[var(--amber)]  border border-[rgba(245,166,35,0.25)]',
  red:    'bg-[rgba(255,77,106,0.1)] text-[var(--red)]    border border-[rgba(255,77,106,0.25)]',
  blue:   'bg-[rgba(77,159,255,0.1)] text-[var(--blue)]   border border-[rgba(77,159,255,0.25)]',
  purple: 'bg-[rgba(155,109,255,0.1)] text-[var(--purple)] border border-[rgba(155,109,255,0.25)]',
  muted:  'bg-[var(--bg4)] text-[var(--text2)] border border-[var(--border2)]',
}

const dotColors = {
  green: 'bg-[var(--green)]',
  amber: 'bg-[var(--amber)]',
  red:   'bg-[var(--red)]',
  blue:  'bg-[var(--blue)]',
  purple:'bg-[var(--purple)]',
  muted: 'bg-[var(--text3)]',
}

export function Badge({ variant = 'muted', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
        'font-mono text-2xs font-medium tracking-[0.08em] uppercase',
        variantClasses[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}
