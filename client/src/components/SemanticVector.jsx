import React from 'react';
import { auditApi } from '../api/client.js';
import { Skeleton } from './ui/skeleton.jsx';

const DIMENSIONS = 8;

/** The entry's semantic vector. The list leaves it out to stay small, so it is fetched for the open entry. */
export default class SemanticVector extends React.Component {
  state = { vector: null };

  componentDidMount() {
    this.load();
  }

  componentDidUpdate(previousProps) {
    const { entryId, version } = this.props;
    if (previousProps.entryId === entryId && previousProps.version === version) return;
    if (previousProps.entryId !== entryId) this.setState({ vector: null });
    this.load();
  }

  async load() {
    const { entryId } = this.props;
    try {
      const entry = await auditApi.get(entryId);
      if (entryId === this.props.entryId) this.setState({ vector: entry.aiMetadata.semanticVector });
    } catch {
      if (entryId === this.props.entryId) this.setState({ vector: [] });
    }
  }

  render() {
    const { vector } = this.state;
    if (vector?.length === 0) return null;
    return (
      <div className="mt-4">
        <p className="text-label-caps" title="Numbers that describe the meaning of the description. Similar descriptions get similar numbers, which powers Find similar.">
          Semantic vector ({DIMENSIONS} dimensions)
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {vector === null
            ? Array.from({ length: DIMENSIONS }, (_, index) => <Skeleton key={index} className="h-5 w-12" />)
            : vector.map((value, index) => (
                <span
                  key={index}
                  title={String(value)}
                  className="rounded border border-border-strong px-1.5 font-mono text-chip text-fg-muted tabular-nums"
                >
                  {value.toFixed(2)}
                </span>
              ))}
        </div>
      </div>
    );
  }
}
