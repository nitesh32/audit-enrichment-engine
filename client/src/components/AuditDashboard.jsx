import React from 'react';
import { toast } from 'sonner';
import { auditApi } from '../api/client.js';
import { describeCompletions } from '../lib/announcements.js';
import {
  applyFilters,
  countPending,
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  isDefaultFilters,
  mergeEntries,
  sortEntries,
} from '../lib/entryFilters.js';
import { Poller } from '../lib/Poller.js';
import { showUpdateToast } from '../lib/updateToast.jsx';
import ApiBanner from './ApiBanner.jsx';
import AuditTable from './AuditTable.jsx';
import EntrySheet from './EntrySheet.jsx';
import KpiStrip from './KpiStrip.jsx';
import NewEntryDialog from './NewEntryDialog.jsx';
import PageHeader from './PageHeader.jsx';
import Toolbar from './Toolbar.jsx';
import TopBar from './TopBar.jsx';
import { Toaster } from './ui/toaster.jsx';

const POLL_BASE_DELAY_MS = 1500;
const POLL_ACTIVE_DELAY_MS = 600; // faster while the AI worker still has entries to finish
const TOAST_GUTTER_PX = 24;
const SHEET_WIDTH_PX = 480;
const SHEET_MIN_VIEWPORT_PX = 640;
const POLL_MAX_DELAY_MS = 15000;
const CLOCK_TICK_MS = 30000;

/** Live audit console: polls the API, owns filters and sorting, and coordinates the sheet and dialog. */
export default class AuditDashboard extends React.Component {
  state = {
    entries: [],
    loading: true,
    apiStatus: 'ok',
    filters: DEFAULT_FILTERS,
    sort: DEFAULT_SORT,
    selectedId: null,
    isSheetOpen: false,
    detachedEntry: null,
    isCreateOpen: false,
    announcement: '',
    now: Date.now(),
  };
  poller = new Poller({
    task: () => this.refresh(),
    getDelayMs: () => (countPending(this.state.entries) > 0 ? POLL_ACTIVE_DELAY_MS : POLL_BASE_DELAY_MS),
    backoffBaseMs: POLL_BASE_DELAY_MS,
    maxDelayMs: POLL_MAX_DELAY_MS,
  });
  clockTimer = null;
  returnFocusTo = null;

  componentDidMount() {
    this.poller.start();
    this.clockTimer = setInterval(() => this.setState({ now: Date.now() }), CLOCK_TICK_MS);
  }

  componentWillUnmount() {
    this.poller.stop();
    clearInterval(this.clockTimer);
  }

  /** @returns {Promise<boolean>} whether the API answered */
  async refresh() {
    try {
      this.applyEntries(await auditApi.list());
      return true;
    } catch {
      this.setState((previous) => (previous.apiStatus === 'down' && !previous.loading ? null : { apiStatus: 'down', loading: false }));
      return false;
    }
  }

  applyEntries(incoming) {
    const announcement = describeCompletions(this.state.entries, incoming);
    this.setState((previous) => {
      const entries = mergeEntries(previous.entries, incoming);
      const isUnchanged = entries === previous.entries && !previous.loading && previous.apiStatus === 'ok';
      if (isUnchanged && !announcement) return null;
      return { entries, loading: false, apiStatus: 'ok', announcement: announcement ?? previous.announcement };
    });
  }

  createEntry = async (payload) => {
    const created = await auditApi.create(payload);
    this.setState((previous) => ({ isCreateOpen: false, entries: [created, ...previous.entries] }));
    toast.success('Evidence ingested · AI analysis queued');
  };

  saveEntry = async (id, patch) => {
    try {
      const { data, updatePath } = await auditApi.update(id, patch);
      showUpdateToast(updatePath, data.durationMs);
      await this.refresh();
    } catch (error) {
      toast.error(error.message);
    }
  };

  openEntry = async (id) => {
    if (!this.state.isSheetOpen) this.returnFocusTo = document.activeElement;
    if (!this.state.entries.some((entry) => entry._id === id)) {
      try {
        this.setState({ detachedEntry: await auditApi.get(id) });
      } catch (error) {
        toast.error(error.message);
        return;
      }
    }
    this.setState({ selectedId: id, isSheetOpen: true });
  };

  /** Radix only restores focus to a Trigger; this sheet has none, so return it to the row that opened it. */
  restoreFocus = (event) => {
    event.preventDefault();
    if (this.returnFocusTo?.isConnected) this.returnFocusTo.focus();
  };

  toastOffsetRight() {
    const sheetCoversRight = this.state.isSheetOpen && window.innerWidth >= SHEET_MIN_VIEWPORT_PX;
    return sheetCoversRight ? SHEET_WIDTH_PX + TOAST_GUTTER_PX : TOAST_GUTTER_PX;
  }

  changeFilters = (change) => this.setState((previous) => ({ filters: { ...previous.filters, ...change } }));

  clearFilters = () => this.setState({ filters: DEFAULT_FILTERS });

  changeSort = (field) =>
    this.setState((previous) => ({
      sort: { field, direction: previous.sort.field === field && previous.sort.direction === 'desc' ? 'asc' : 'desc' },
    }));

  findSelectedEntry() {
    const { entries, selectedId, detachedEntry } = this.state;
    return entries.find((entry) => entry._id === selectedId) ?? (detachedEntry?._id === selectedId ? detachedEntry : null);
  }

  render() {
    const { entries, loading, apiStatus, filters, sort, isSheetOpen, isCreateOpen, announcement } = this.state;
    const isApiDown = apiStatus === 'down';
    const selectedEntry = this.findSelectedEntry();
    return (
      <div className="min-h-screen">
        <TopBar isApiDown={isApiDown} />
        <main className="mx-auto flex max-w-360 flex-col gap-5 px-4 py-6 md:px-6">
          <PageHeader onNewEntry={() => this.setState({ isCreateOpen: true })} />
          <KpiStrip entries={entries} />
          <Toolbar filters={filters} isApiDown={isApiDown} onFiltersChange={this.changeFilters} />
          {isApiDown && <ApiBanner />}
          <AuditTable
            entries={sortEntries(applyFilters(entries, filters), sort)}
            loading={loading}
            sort={sort}
            hasActiveFilter={!isDefaultFilters(filters)}
            onSort={this.changeSort}
            onClearFilters={this.clearFilters}
            onNewEntry={() => this.setState({ isCreateOpen: true })}
            onOpen={this.openEntry}
          />
        </main>
        {selectedEntry && (
          <EntrySheet
            entry={selectedEntry}
            open={isSheetOpen}
            onOpenChange={(open) => this.setState({ isSheetOpen: open })}
            onSave={this.saveEntry}
            onFindSimilar={auditApi.findSimilar}
            onOpenEntry={this.openEntry}
            onCloseAutoFocus={this.restoreFocus}
          />
        )}
        <NewEntryDialog
          open={isCreateOpen}
          onOpenChange={(open) => this.setState({ isCreateOpen: open })}
          onCreate={this.createEntry}
        />
        <Toaster offsetRight={this.toastOffsetRight()} />
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </div>
    );
  }
}
