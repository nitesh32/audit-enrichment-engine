import { Zap } from 'lucide-react';
import { toast } from 'sonner';

const FAST_TRACK = 'FAST_TRACK';
const AI_REQUEUE = 'AI_REQUEUE';

/** Tells the auditor which path an update took (read from the X-Update-Path header). */
export function showUpdateToast(updatePath, durationMs) {
  if (updatePath === FAST_TRACK) {
    toast.success(`Notes saved · ${durationMs} ms · AI skipped`, { icon: <Zap className="size-4" aria-hidden="true" /> });
  } else if (updatePath === AI_REQUEUE) {
    toast.success('Re-queued for AI analysis');
  } else {
    toast('No changes to save');
  }
}
