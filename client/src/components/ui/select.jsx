import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

/** Single-choice select. Option values must be non-empty strings. */
export function Select({ value, onValueChange, options, label, id }) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger
        id={id}
        aria-label={label}
        className="inline-flex h-8 items-center justify-between gap-2 rounded-md border border-border-strong bg-surface px-3 text-body hover:bg-surface-2"
      >
        <RadixSelect.Value />
        <ChevronDown className="size-4 text-fg-subtle" aria-hidden="true" />
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-40 rounded-md border border-border bg-surface p-1 shadow-sm"
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="relative flex h-8 cursor-pointer items-center rounded px-8 text-body outline-none data-[highlighted]:bg-surface-2"
              >
                <RadixSelect.ItemIndicator className="absolute left-2">
                  <Check className="size-4" aria-hidden="true" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
