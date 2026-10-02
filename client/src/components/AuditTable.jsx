import React from 'react';
import AuditRow from './AuditRow.jsx';

const HEADERS = ['Evidence', 'Entity', 'Amount', 'Control', 'Status', 'Risk', 'AI summary', 'Flags', ''];
const RIGHT_ALIGNED = new Set(['Amount', 'Risk']);

/** Live audit stream with loading, error and empty states. */
export default class AuditTable extends React.Component {
  renderMessage(text, tone = 'text-muted') {
    return <p className={`rounded border border-line bg-panel p-6 text-sm ${tone}`}>{text}</p>;
  }

  render() {
    const { entries, loading, error, similar, onEdit, onFindSimilar } = this.props;
    if (loading) return this.renderMessage('Loading audit entries...');
    if (error && entries.length === 0) return this.renderMessage(error, 'text-danger');
    if (entries.length === 0) return this.renderMessage('No audit entries yet. Create one or run npm run seed.');
    return (
      <div className="overflow-x-auto rounded border border-line bg-panel">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              {HEADERS.map((header) => (
                <th key={header} className={`px-3 py-2 font-medium ${RIGHT_ALIGNED.has(header) ? 'text-right' : ''}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <AuditRow
                key={entry._id}
                entry={entry}
                similarState={similar[entry._id]}
                onEdit={onEdit}
                onFindSimilar={onFindSimilar}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
