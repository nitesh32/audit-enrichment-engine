import { cva } from 'class-variance-authority';
import { cn } from '../../lib/cn.js';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium select-none transition-[opacity,transform] duration-150 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg enabled:hover:opacity-90',
        secondary: 'border border-border-strong bg-surface enabled:hover:bg-surface-2',
        ghost: 'text-fg-muted enabled:hover:bg-surface-2 enabled:hover:text-fg',
      },
      size: {
        md: 'h-8 px-3 text-body',
        sm: 'h-7 px-2 text-label',
        icon: 'size-8',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export function Button({ variant, size, className, type = 'button', ...props }) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
