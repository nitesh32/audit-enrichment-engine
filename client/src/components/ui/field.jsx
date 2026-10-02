import { cn } from '../../lib/cn.js';

const CONTROL_CLASS =
  'w-full rounded-md border border-border-strong bg-surface px-3 text-body placeholder:text-fg-subtle aria-[invalid=true]:border-risk-high';

export function Input({ className, ...props }) {
  return <input className={cn(CONTROL_CLASS, 'h-8', className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(CONTROL_CLASS, 'py-2', className)} {...props} />;
}

/** Label above a control, with an optional error line below. */
export function Field({ label, htmlFor, error, hint, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-label-caps">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-label text-fg-subtle">{hint}</p>}
      {error && (
        <p role="alert" className="text-label text-risk-high">
          {error}
        </p>
      )}
    </div>
  );
}
