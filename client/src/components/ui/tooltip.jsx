import * as RadixTooltip from '@radix-ui/react-tooltip';

/** Wraps a single child; renders it untouched when there is no content. */
export function Tooltip({ content, children, side = 'top' }) {
  if (!content) return children;
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            className="z-50 max-w-xs rounded-md border border-border bg-surface px-2 py-1 text-label text-fg shadow-sm"
          >
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
