import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: LucideIcon
  iconRight?: LucideIcon
  children: React.ReactNode
}

const sizeClasses = {
  sm: 'px-3.5 py-2 text-sm gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-7 py-3.5 text-base gap-2.5 rounded-xl',
}

const variantClasses = {
  primary: cn(
    'bg-[var(--green)] text-[#07090f] font-bold font-syne',
    'hover:shadow-green-glow hover:brightness-105 active:brightness-95',
    'active:scale-[0.98]'
  ),
  secondary: cn(
    'bg-[var(--bg4)] text-[var(--text)] border border-[var(--border2)] font-syne font-semibold',
    'hover:bg-[var(--bg5)] hover:border-[var(--border3)]',
    'active:scale-[0.98]'
  ),
  ghost: cn(
    'bg-transparent text-[var(--text2)] border border-[var(--border2)] font-syne',
    'hover:bg-[var(--bg4)] hover:text-[var(--text)] hover:border-[var(--border3)]',
    'active:scale-[0.98]'
  ),
  danger: cn(
    'bg-[rgba(255,77,106,0.08)] text-[var(--red)] border border-[rgba(255,77,106,0.2)] font-syne',
    'hover:bg-[rgba(255,77,106,0.14)] hover:border-[rgba(255,77,106,0.35)]',
    'active:scale-[0.98]'
  ),
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center',
        'transition-all duration-150 cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={2} className="flex-shrink-0" />
      ) : null}
      {children}
      {!loading && IconRight && (
        <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} strokeWidth={2} className="flex-shrink-0" />
      )}
    </button>
  )
}
