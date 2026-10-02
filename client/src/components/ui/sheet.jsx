import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from './button.jsx';

const ENTER = { duration: 0.2, ease: 'easeOut' };
const EXIT = { duration: 0.15, ease: 'easeIn' };

/** Right-hand side sheet (full screen on mobile) with focus trap and focus return. */
export function Sheet({ open, onOpenChange, title, subtitle, onCloseAutoFocus, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: EXIT }}
                transition={ENTER}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined} onCloseAutoFocus={onCloseAutoFocus}>
              <motion.aside
                className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface shadow-sm sm:max-w-120"
                initial={{ x: 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 24, opacity: 0, transition: EXIT }}
                transition={ENTER}
              >
                <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
                  <div className="min-w-0">
                    <Dialog.Title className="font-mono text-title font-semibold">{title}</Dialog.Title>
                    <div className="mt-1 text-body text-fg-muted">{subtitle}</div>
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon" aria-label="Close">
                      <X aria-hidden="true" />
                    </Button>
                  </Dialog.Close>
                </header>
                <div className="flex-1 overflow-y-auto">{children}</div>
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
