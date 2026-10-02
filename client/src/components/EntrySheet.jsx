import React from 'react';
import { createDrafts, isCoreDirty, isCoreValid, isNotesDirty } from '../lib/entryDrafts.js';
import AiAssessmentSection from './AiAssessmentSection.jsx';
import CoreEvidenceSection from './CoreEvidenceSection.jsx';
import NotesSection from './NotesSection.jsx';
import RelativeTime from './RelativeTime.jsx';
import SimilarSection from './SimilarSection.jsx';
import StatusBadge from './StatusBadge.jsx';
import { Sheet } from './ui/sheet.jsx';

const NO_SIMILAR_SEARCH = { loading: false, results: null, error: null };

/** Detail sheet for one entry: AI result, notes (fast track), core edit (AI path) and similar search. */
export default class EntrySheet extends React.Component {
  state = { drafts: createDrafts(this.props.entry), saving: null, similar: NO_SIMILAR_SEARCH };

  componentDidUpdate(previousProps) {
    if (previousProps.entry._id === this.props.entry._id) return;
    this.setState({ drafts: createDrafts(this.props.entry), saving: null, similar: NO_SIMILAR_SEARCH });
  }

  setNotes = (notes) => this.setState((previous) => ({ drafts: { ...previous.drafts, notes } }));

  setCore = (change) =>
    this.setState((previous) => ({ drafts: { ...previous.drafts, core: { ...previous.drafts.core, ...change } } }));

  save = async (section, patch) => {
    this.setState({ saving: section });
    try {
      await this.props.onSave(this.props.entry._id, patch);
    } finally {
      this.setState({ saving: null });
    }
  };

  saveNotes = () => this.save('notes', { auditorNotes: this.state.drafts.notes });

  saveCore = () => {
    const { monetaryImpact, description, controlId } = this.state.drafts.core;
    return this.save('core', { monetaryImpact: Number(monetaryImpact), description, controlId });
  };

  findSimilar = async () => {
    const entryId = this.props.entry._id;
    this.setState({ similar: { loading: true, results: null, error: null } });
    try {
      const results = await this.props.onFindSimilar(entryId);
      if (entryId === this.props.entry._id) this.setState({ similar: { loading: false, results, error: null } });
    } catch (error) {
      if (entryId === this.props.entry._id) {
        this.setState({ similar: { loading: false, results: null, error: error.message } });
      }
    }
  };

  render() {
    const { entry, open, onOpenChange, onOpenEntry, onCloseAutoFocus } = this.props;
    const { drafts, saving, similar } = this.state;
    return (
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        onCloseAutoFocus={onCloseAutoFocus}
        title={entry.evidenceId}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {entry.entityName}
            <StatusBadge status={entry.aiMetadata.status} riskLevel={entry.aiMetadata.riskLevel} lastError={entry.aiMetadata.lastError} />
            <span className="text-fg-subtle">
              Added <RelativeTime value={entry.created} />
            </span>
          </span>
        }
      >
        <AiAssessmentSection entry={entry} />
        <NotesSection
          value={drafts.notes}
          onChange={this.setNotes}
          onSave={this.saveNotes}
          isSaving={saving === 'notes'}
          isDirty={isNotesDirty(entry, drafts)}
        />
        <CoreEvidenceSection
          draft={drafts.core}
          onChange={this.setCore}
          onSave={this.saveCore}
          isSaving={saving === 'core'}
          isDirty={isCoreDirty(entry, drafts)}
          isValid={isCoreValid(drafts)}
        />
        <SimilarSection
          canSearch={entry.aiMetadata.status === 'COMPLETED'}
          similar={similar}
          onFind={this.findSimilar}
          onOpenEntry={onOpenEntry}
        />
      </Sheet>
    );
  }
}
