import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent font-medium whitespace-nowrap select-none transition-transform duration-150 enabled:active:scale-[0.98] disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg enabled:hover:bg-accent-hover disabled:border-border disabled:bg-surface-2 disabled:text-fg-subtle',
        secondary: 'border-border-strong bg-surface text-fg enabled:hover:bg-surface-2 disabled:border-border disabled:bg-surface-2 disabled:text-fg-subtle',
        ghost: 'text-fg-muted enabled:hover:bg-surface-2 enabled:hover:text-fg disabled:text-fg-subtle',
        link: 'rounded-sm text-accent underline-offset-4 enabled:hover:underline disabled:text-fg-subtle',
      },
      size: {
        md: 'h-8 px-3 text-body',
        sm: 'h-7 px-2.5 text-label',
        icon: 'size-8',
      },
    },
    compoundVariants: [{ variant: 'link', class: 'h-auto px-0' }],
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

/** `loading` shows a spinner and disables the button until the action finishes. */
export function Button({ variant, size, loading = false, disabled, className, type = 'button', children, ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
