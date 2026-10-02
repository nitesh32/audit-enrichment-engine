import React from 'react';
import { ApiError, auditApi } from '../api/client.js';
import AuditTable from './AuditTable.jsx';
import EntryEditor from './EntryEditor.jsx';
import NewEntryForm from './NewEntryForm.jsx';

const POLL_INTERVAL_MS = 1500;
const TOAST_DURATION_MS = 4000;
const FAST_TRACK = 'FAST_TRACK';
const AI_REQUEUE = 'AI_REQUEUE';

/** Live audit stream: polls the API, shows AI results and runs similarity searches. */
export default class AuditDashboard extends React.Component {
  state = { entries: [], loading: true, error: null, selectedId: null, similar: {}, toast: null };
  pollTimer = null;
  toastTimer = null;

  componentDidMount() {
    this.refresh();
    this.pollTimer = setInterval(this.refreshWhenVisible, POLL_INTERVAL_MS);
  }

  componentWillUnmount() {
    clearInterval(this.pollTimer);
    clearTimeout(this.toastTimer);
  }

  refreshWhenVisible = () => {
    if (!document.hidden) this.refresh();
  };

  refresh = async () => {
    try {
      const entries = await auditApi.list();
      this.setState({ entries, loading: false, error: null });
    } catch (error) {
      this.setState({ loading: false, error: error.message });
    }
  };

  showToast(message) {
    clearTimeout(this.toastTimer);
    this.setState({ toast: message });
    this.toastTimer = setTimeout(() => this.setState({ toast: null }), TOAST_DURATION_MS);
  }

  createEntry = async (entry) => {
    try {
      await auditApi.create(entry);
      this.showToast('Entry created. Waiting for AI analysis.');
      await this.refresh();
      return true;
    } catch (error) {
      this.showToast(error instanceof ApiError ? error.message : 'Could not create entry');
      return false;
    }
  };

  saveEntry = async (id, patch) => {
    try {
      const { data, updatePath } = await auditApi.update(id, patch);
      this.showToast(this.describeUpdate(updatePath, data.durationMs));
      await this.refresh();
    } catch (error) {
      this.showToast(error.message);
    }
  };

  describeUpdate(updatePath, durationMs) {
    if (updatePath === FAST_TRACK) return `Saved in ${durationMs}ms · AI skipped (fast-track)`;
    if (updatePath === AI_REQUEUE) return 'Re-queued for AI analysis';
    return 'No changes to save';
  }

  findSimilar = async (id) => {
    this.setSimilarState(id, { loading: true, results: [], error: null });
    try {
      const results = await auditApi.findSimilar(id);
      this.setSimilarState(id, { loading: false, results, error: null });
    } catch (error) {
      this.setSimilarState(id, { loading: false, results: [], error: error.message });
    }
  };

  setSimilarState(id, similarState) {
    this.setState((previous) => ({ similar: { ...previous.similar, [id]: similarState } }));
  }

  render() {
    const { entries, loading, error, selectedId, similar, toast } = this.state;
    const selectedEntry = entries.find((entry) => entry._id === selectedId);
    return (
      <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header>
          <h1 className="text-lg font-medium">SmartAudit</h1>
          <p className="text-sm text-muted">AI-enriched continuous audit stream</p>
        </header>
        <NewEntryForm onCreate={this.createEntry} />
        <AuditTable
          entries={entries}
          loading={loading}
          error={error}
          similar={similar}
          onEdit={(id) => this.setState({ selectedId: id })}
          onFindSimilar={this.findSimilar}
        />
        {selectedEntry && (
          <EntryEditor
            key={selectedEntry._id}
            entry={selectedEntry}
            onSave={this.saveEntry}
            onClose={() => this.setState({ selectedId: null })}
          />
        )}
        {toast && (
          <div role="status" className="fixed bottom-6 left-6 z-20 rounded bg-accent px-4 py-2 text-sm text-on-accent">
            {toast}
          </div>
        )}
      </main>
    );
  }
}
