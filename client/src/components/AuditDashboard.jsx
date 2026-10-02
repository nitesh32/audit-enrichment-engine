import React from 'react';
import { toast } from 'sonner';
import { auditApi } from '../api/client.js';
import { describeCompletions } from '../lib/announcements.js';
import { DEFAULT_FILTERS, DEFAULT_SORT, isDefaultFilters } from '../lib/entryFilters.js';
import { buildListParams, PAGE_SIZE } from '../lib/listParams.js';
import { mergeListResponse, nextSort } from '../lib/listState.js';
import { Poller } from '../lib/Poller.js';
import { showUpdateToast } from '../lib/updateToast.jsx';
import ApiBanner from './ApiBanner.jsx';
import AuditPagination from './AuditPagination.jsx';
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
const POLL_MAX_DELAY_MS = 15000;
const CLOCK_TICK_MS = 30000;
const FILTER_DEBOUNCE_MS = 250;
const EMPTY_SUMMARY = { total: 0, pending: 0, highRisk: 0, averageRiskScore: null };

/** Live audit console: polls one server-side page of entries, and owns paging, filters, sorting, the sheet and dialog. */
export default class AuditDashboard extends React.Component {
  state = {
    entries: [], total: 0, totalPages: 1, summary: EMPTY_SUMMARY,
    page: 1, filters: DEFAULT_FILTERS, sort: DEFAULT_SORT,
    loading: true, apiStatus: 'ok',
    sheetEntry: null, isSheetOpen: false, isCreateOpen: false,
    announcement: '', now: Date.now(),
  };
  poller = new Poller({
    task: () => this.refresh(),
    getDelayMs: () => (this.state.summary.pending > 0 ? POLL_ACTIVE_DELAY_MS : POLL_BASE_DELAY_MS),
    backoffBaseMs: POLL_BASE_DELAY_MS,
    maxDelayMs: POLL_MAX_DELAY_MS,
  });
  clockTimer = null;
  filterTimer = null;
  requestCounter = 0;
  returnFocusTo = null;

  componentDidMount() {
    this.poller.start();
    this.clockTimer = setInterval(() => this.setState({ now: Date.now() }), CLOCK_TICK_MS);
  }

  componentWillUnmount() {
    this.poller.stop();
    clearInterval(this.clockTimer);
    clearTimeout(this.filterTimer);
  }

  /** Fetches the current page and the summary. @returns {Promise<boolean>} whether the API answered */
  async refresh() {
    const requestId = ++this.requestCounter;
    const { page, filters, sort } = this.state;
    try {
      const [list, summary] = await Promise.all([
        auditApi.list(buildListParams({ page, filters, sort })),
        auditApi.summary(),
      ]);
      if (requestId === this.requestCounter) this.applyResponse(list, summary);
      await this.refreshOffPageSheetEntry();
      return true;
    } catch {
      this.setState((previous) => (previous.apiStatus === 'down' && !previous.loading ? null : { apiStatus: 'down', loading: false }));
      return false;
    }
  }

  applyResponse(list, summary) {
    const announcement = describeCompletions(this.state.entries, list.items);
    this.setState((previous) => {
      const changes = mergeListResponse(previous, list, summary);
      if (!changes && !announcement) return null;
      return { ...changes, announcement: announcement ?? previous.announcement };
    });
  }

  /** An entry opened from similar results may not be on this page; keep its sheet data current anyway. */
  async refreshOffPageSheetEntry() {
    const { sheetEntry, isSheetOpen, entries } = this.state;
    if (!isSheetOpen || !sheetEntry || entries.some((entry) => entry._id === sheetEntry._id)) return;
    const fresh = await auditApi.get(sheetEntry._id);
    if (fresh.updated !== sheetEntry.updated) this.setState({ sheetEntry: fresh });
  }

  refreshSoon = () => {
    clearTimeout(this.filterTimer);
    this.filterTimer = setTimeout(() => this.refresh(), FILTER_DEBOUNCE_MS);
  };

  changePage = (page) => this.setState({ page }, () => this.refresh());

  changeFilters = (change) =>
    this.setState((previous) => ({ filters: { ...previous.filters, ...change }, page: 1 }), this.refreshSoon);

  clearFilters = () => this.setState({ filters: DEFAULT_FILTERS, page: 1 }, () => this.refresh());

  changeSort = (field) =>
    this.setState((previous) => ({ sort: nextSort(previous.sort, field), page: 1 }), () => this.refresh());

  /** Rejects with the API error so the dialog can show field messages. */
  createEntry = async (payload) => {
    await auditApi.create(payload);
    // Jump to the newest-first first page so the new PENDING row is visible.
    this.setState({ isCreateOpen: false, page: 1, filters: DEFAULT_FILTERS, sort: DEFAULT_SORT }, () => this.refresh());
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
    let entry = this.state.entries.find((candidate) => candidate._id === id);
    if (!entry) {
      try {
        entry = await auditApi.get(id);
      } catch (error) {
        toast.error(error.message);
        return;
      }
    }
    this.setState({ sheetEntry: entry, isSheetOpen: true });
  };

  /** Radix only restores focus to a Trigger; this sheet has none, so return it to the row that opened it. */
  restoreFocus = (event) => {
    event.preventDefault();
    if (this.returnFocusTo?.isConnected) this.returnFocusTo.focus();
  };

  render() {
    const { entries, total, totalPages, summary, page, filters, sort, loading, apiStatus } = this.state;
    const { sheetEntry, isSheetOpen, isCreateOpen, announcement } = this.state;
    const isApiDown = apiStatus === 'down';
    return (
      <div className="min-h-screen">
        <TopBar isApiDown={isApiDown} />
        <main className="mx-auto flex max-w-360 flex-col gap-5 px-4 py-6 md:px-6">
          <PageHeader onNewEntry={() => this.setState({ isCreateOpen: true })} />
          <KpiStrip summary={summary} />
          <Toolbar filters={filters} isApiDown={isApiDown} onFiltersChange={this.changeFilters} />
          {isApiDown && <ApiBanner />}
          <AuditTable
            entries={entries}
            loading={loading}
            sort={sort}
            hasActiveFilter={!isDefaultFilters(filters)}
            onSort={this.changeSort}
            onClearFilters={this.clearFilters}
            onNewEntry={() => this.setState({ isCreateOpen: true })}
            onOpen={this.openEntry}
          />
          {!loading && total > 0 && (
            <AuditPagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={this.changePage} />
          )}
        </main>
        {sheetEntry && (
          <EntrySheet
            entry={sheetEntry}
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
        <Toaster isSheetOpen={isSheetOpen} />
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </div>
    );
  }
}
