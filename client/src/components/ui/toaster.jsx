import { Toaster as SonnerToaster } from 'sonner';

/** Bottom-right toasts; `offsetRight` moves them clear of the open detail sheet. */
export function Toaster({ offsetRight }) {
  return (
    <SonnerToaster
      className="toaster"
      position="bottom-right"
      visibleToasts={3}
      duration={3000}
      offset={{ right: offsetRight, bottom: 24 }}
    />
  );
}
