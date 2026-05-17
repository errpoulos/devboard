import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 cursor-pointer',
          {
            'bg-neon-lime text-pitch-black hover:bg-[#cdd91f] font-[590] tracking-[-0.13px]':
              variant === 'default',
            'border border-charcoal-grey bg-transparent text-light-steel hover:bg-deep-slate hover:border-muted-ash':
              variant === 'outline',
            'bg-transparent text-storm-cloud hover:text-porcelain hover:bg-charcoal-grey':
              variant === 'ghost',
            'bg-transparent text-warning-red hover:bg-warning-red/10':
              variant === 'destructive',
          },
          {
            'h-7 px-3 text-[13px]': size === 'sm',
            'h-9 px-4 text-[14px]': size === 'md',
            'h-11 px-6 text-[15px]': size === 'lg',
          },
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'

export { Button }
