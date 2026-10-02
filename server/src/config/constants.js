export const STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
});

export const RISK_LEVEL = Object.freeze({ LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' });

export const PROVIDER = Object.freeze({
  OPENROUTER: 'openrouter',
  MOCK: 'mock',
  MOCK_FALLBACK: 'mock-fallback',
});

export const UPDATE_PATH = Object.freeze({
  FAST_TRACK: 'FAST_TRACK',
  AI_REQUEUE: 'AI_REQUEUE',
  NO_CHANGE: 'NO_CHANGE',
});

export const WORKER_OUTCOME = Object.freeze({
  COMPLETED: 'completed',
  DISCARDED: 'discarded',
  RETRY: 'retry',
  FAILED: 'failed',
  IDLE: 'idle',
});

export const ANOMALY_FLAG = Object.freeze({
  MONETARY_THRESHOLD_EXCEEDED: 'MONETARY_THRESHOLD_EXCEEDED',
  MANUAL_OVERRIDE: 'MANUAL_OVERRIDE',
  ROUND_AMOUNT: 'ROUND_AMOUNT',
  OFF_HOURS_ACTIVITY: 'OFF_HOURS_ACTIVITY',
  UNUSUAL_DESCRIPTION_PATTERN: 'UNUSUAL_DESCRIPTION_PATTERN',
});

export const CORE_FIELDS = Object.freeze(['monetaryImpact', 'description', 'controlId']);

// Risk rules
export const MONETARY_THRESHOLD = 50000;
export const ROUND_AMOUNT_UNIT = 1000;
export const FINANCE_CONTROL_PREFIX = 'CTRL-FIN-';
export const BUSINESS_HOURS_UTC = Object.freeze({ START: 8, END: 20 });
export const OVERRIDE_KEYWORDS = Object.freeze(['override', 'bypass', 'manual']);
export const SUSPICIOUS_KEYWORDS = Object.freeze(['urgent', 'cash', 'exception']);
export const MEDIUM_RISK_MIN_SCORE = 40;
export const HIGH_RISK_MIN_SCORE = 70;
export const RISK_WEIGHTS = Object.freeze({
  AMOUNT_LOG_FACTOR: 7,
  AMOUNT_MAX: 40,
  KEYWORD: 8,
  KEYWORD_MAX_COUNT: 3,
  THRESHOLD: 15,
  ROUND_AMOUNT: 5,
  OFF_HOURS: 10,
  FINANCE_CONTROL: 5,
  MAX_SCORE: 100,
});

// Queue and worker
export const LOCK_TTL_MS = 120000; // longer than the worst-case AI job (timeouts x retries)
export const MAX_ATTEMPTS = 3;
export const BACKOFF_BASE_MS = 1000;
export const POLL_INTERVAL_MS = 500;

// AI
export const MOCK_DELAY_MS = 2000; // about as long as a real model call (the brief suggests 400)
export const MOCK_DELAY_JITTER = 0.3; // each mock call takes the base delay +/- 30%, like a real model
export const VECTOR_DIM = 8;
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const AI_REQUEST_TIMEOUT_MS = 15000;
export const AI_MAX_RETRIES = 2;
export const AI_RETRY_BASE_MS = 500;

// API
export const SIMILAR_TOP_K = 3;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
/** Sortable list fields and the document paths they map to. */
export const LIST_SORT_PATHS = Object.freeze({
  created: 'created',
  monetaryImpact: 'monetaryImpact',
  riskScore: 'aiMetadata.riskScore',
});
/** Status filter values and the stored statuses each one matches. */
export const STATUS_FILTER_MATCHES = Object.freeze({
  PENDING: [STATUS.PENDING, STATUS.PROCESSING],
  COMPLETED: [STATUS.COMPLETED],
  FAILED: [STATUS.FAILED],
});
export const UPDATE_MAX_ATTEMPTS = 2;
export const TENANT_HEADER = 'x-tenant-id';
export const UPDATE_PATH_HEADER = 'X-Update-Path';
