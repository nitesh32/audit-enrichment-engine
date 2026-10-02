import { clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge must know our custom type scale, or it treats `text-body` as a colour
// and drops the real text colour (for example `text-accent-fg`) from the same element.
const FONT_SIZES = ['chip', 'label', 'body', 'title', 'page', 'kpi'];

const mergeClasses = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: FONT_SIZES }], 'label-caps': ['text-label-caps'] } },
});

/** Joins class names and resolves conflicting Tailwind utilities. */
export const cn = (...inputs) => mergeClasses(clsx(inputs));
