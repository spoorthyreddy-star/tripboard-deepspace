import React from 'react'
import { cn } from '@/lib/utils'

const VARIANTS = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'border border-border text-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  info: 'bg-info text-info-foreground',
}

const SIZES = {
  default: 'px-2.5 py-0.5 text-xs',
  sm: 'px-2 py-px text-[10px]',
  lg: 'px-3 py-1 text-sm',
}

export function Badge({ className, variant = 'default', size = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        VARIANTS[variant] || VARIANTS.default,
        SIZES[size] || SIZES.default,
        className,
      )}
      {...props}
    />
  )
}
