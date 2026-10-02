import React from 'react';
import { Skeleton } from './ui/skeleton.jsx';

/** Placeholder with the same cell layout as AuditRow, so loading causes no layout shift. */
export default class AuditRowSkeleton extends React.Component {
  render() {
    return (
      <tr className="h-11 border-t border-border" aria-hidden="true">
        <td className="px-3 py-1">
          <Skeleton className="mb-1 h-3 w-20" />
          <Skeleton className="h-3 w-36" />
        </td>
        <td className="px-3 py-1">
          <Skeleton className="ml-auto h-3 w-16" />
        </td>
        <td className="hidden px-3 py-1 lg:table-cell">
          <Skeleton className="h-3 w-20" />
        </td>
        <td className="px-3 py-1">
          <Skeleton className="h-5 w-16 rounded-full" />
        </td>
        <td className="px-3 py-1">
          <Skeleton className="ml-auto h-3 w-16" />
        </td>
        <td className="hidden px-3 py-1 md:table-cell">
          <Skeleton className="mb-2 h-3 w-[70%]" />
          <Skeleton className="h-3 w-[45%]" />
        </td>
        <td className="hidden px-3 py-1 xl:table-cell">
          <Skeleton className="h-4 w-28" />
        </td>
        <td className="w-8 pr-3" />
      </tr>
    );
  }
}
