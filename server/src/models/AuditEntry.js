import mongoose from 'mongoose';
import { PROVIDER, RISK_LEVEL, STATUS } from '../config/constants.js';

const { Schema } = mongoose;

const aiMetadataSchema = new Schema(
  {
    status: { type: String, enum: Object.values(STATUS), default: STATUS.PENDING },
    riskScore: { type: Number, default: null },
    riskLevel: { type: String, enum: [...Object.values(RISK_LEVEL), null], default: null },
    aiSummary: { type: String, default: null },
    anomalyFlags: { type: [String], default: [] },
    semanticVector: { type: [Number], default: [] },
    auditorNotes: { type: String, default: '' },
    provider: { type: String, enum: [...Object.values(PROVIDER), null], default: null },
    processedVersion: { type: Number, default: null },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    lastError: { type: String, default: null },
    lockedBy: { type: String, default: null },
    lockedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { _id: false },
);

const auditEntrySchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    eventType: { type: String, required: true },
    evidenceId: { type: String, required: true },
    entityName: { type: String, required: true },
    description: { type: String, required: true },
    monetaryImpact: { type: Number, required: true },
    controlId: { type: String, required: true },
    actorUserId: { type: String, required: true },
    tenantId: { type: Schema.Types.ObjectId, required: true },
    inputVersion: { type: Number, default: 1 },
    aiMetadata: { type: aiMetadataSchema, default: () => ({}) },
  },
  { timestamps: { createdAt: 'created', updatedAt: 'updated' } },
);

auditEntrySchema.index({ 'aiMetadata.status': 1, 'aiMetadata.nextAttemptAt': 1 });
auditEntrySchema.index({ 'aiMetadata.status': 1, 'aiMetadata.lockedAt': 1 });
auditEntrySchema.index({ tenantId: 1, evidenceId: 1 }, { unique: true });
auditEntrySchema.index({ tenantId: 1, 'aiMetadata.status': 1 });

export const AuditEntry = mongoose.model('AuditEntry', auditEntrySchema);
