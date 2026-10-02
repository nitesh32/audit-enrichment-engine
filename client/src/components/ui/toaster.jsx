import { Toaster as SonnerToaster } from 'sonner';

const GUTTER_PX = 24;
const SHEET_WIDTH_PX = 480;
const SHEET_MIN_VIEWPORT_PX = 640;

/** Bottom-right toasts; they move left of the detail sheet while it is open on wide screens. */
export function Toaster({ isSheetOpen }) {
  const clearsSheet = isSheetOpen && window.innerWidth >= SHEET_MIN_VIEWPORT_PX;
  return (
    <SonnerToaster
      className="toaster"
      position="bottom-right"
      visibleToasts={3}
      duration={3000}
      offset={{ right: clearsSheet ? SHEET_WIDTH_PX + GUTTER_PX : GUTTER_PX, bottom: GUTTER_PX }}
    />
  );
}
