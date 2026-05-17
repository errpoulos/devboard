import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-charcoal-grey bg-transparent px-3 py-2 text-[14px] text-porcelain placeholder:text-fog-grey focus-visible:outline-none focus-visible:border-muted-ash focus-visible:ring-1 focus-visible:ring-muted-ash disabled:cursor-not-allowed disabled:opacity-40 tracking-[-0.13px]',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'

export { Input }
