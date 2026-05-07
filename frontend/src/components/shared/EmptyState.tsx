import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--bg4)] flex items-center justify-center">
          <Icon size={22} className="text-[var(--text3)]" />
        </div>
      )}
      <div>
        <p className="font-syne font-semibold text-[var(--text2)] text-sm">{title}</p>
        {description && (
          <p className="text-[var(--text3)] text-xs mt-1 font-dm">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
