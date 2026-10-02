import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from './button.jsx';

const ENTER = { duration: 0.2, ease: 'easeOut' };
const EXIT = { duration: 0.15, ease: 'easeIn' };

/** Centered modal dialog with focus trap. */
export function Dialog({ open, onOpenChange, title, children }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: EXIT }}
                transition={ENTER}
              />
            </RadixDialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <RadixDialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  className="pointer-events-auto w-full max-w-lg rounded-lg border border-border bg-surface shadow-sm"
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 8, opacity: 0, transition: EXIT }}
                  transition={ENTER}
                >
                  <header className="flex items-center justify-between border-b border-border px-6 py-4">
                    <RadixDialog.Title className="text-title font-semibold">{title}</RadixDialog.Title>
                    <RadixDialog.Close asChild>
                      <Button variant="ghost" size="icon" aria-label="Close">
                        <X aria-hidden="true" />
                      </Button>
                    </RadixDialog.Close>
                  </header>
                  {children}
                </motion.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
