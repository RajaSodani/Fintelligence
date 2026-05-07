import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  title?: string
}

export function Card({ children, className, hover = false, glow = false, title }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl shadow-card',
        'transition-all duration-200',
        hover && 'hover:border-[var(--border3)] hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer',
        glow && 'border-[rgba(0,232,122,0.2)] shadow-[0_0_0_1px_rgba(0,232,122,0.08)]',
        className
      )}
    >
      {title && (
        <div className="px-5 pt-5 pb-0">
          <h2 className="font-syne font-bold text-[15px] text-[var(--text)] mb-4">{title}</h2>
        </div>
      )}
      {title ? <div className="px-5 pb-5">{children}</div> : children}
    </div>
  )
}
