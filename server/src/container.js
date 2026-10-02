import { AuditController } from './controllers/AuditController.js';
import { AuditRepository } from './repositories/AuditRepository.js';
import { AIService } from './services/ai/AIService.js';
import { MockAIProvider } from './services/ai/MockAIProvider.js';
import { OpenRouterProvider } from './services/ai/OpenRouterProvider.js';
import { AuditService } from './services/AuditService.js';
import { SimilarityService } from './services/SimilarityService.js';
import { AIWorkerService } from './workers/AIWorkerService.js';
import { POLL_INTERVAL_MS } from './config/constants.js';

function createAIService(config, logger) {
  const mockProvider = new MockAIProvider();
  const hasApiKey = Boolean(config.OPENROUTER_API_KEY);
  if (!config.MOCK_AI && !hasApiKey) logger.warn('MOCK_AI is false but OPENROUTER_API_KEY is empty; using the mock AI');
  const useMock = config.MOCK_AI || !hasApiKey;
  const provider = useMock
    ? mockProvider
    : new OpenRouterProvider({ apiKey: config.OPENROUTER_API_KEY, model: config.OPENROUTER_MODEL });
  logger.info({ provider: provider.name, model: useMock ? null : config.OPENROUTER_MODEL }, 'ai.provider');
  return new AIService({
    provider,
    fallbackProvider: mockProvider,
    logger,
    maxConcurrency: config.AI_MAX_CONCURRENCY,
  });
}

/**
 * Composition root: the only place that wires classes together.
 * @param {{ config: object, logger: object, aiService?: object }} options
 *   `aiService` overrides the configured one (used by tests).
 */
export function buildContainer({ config, logger, aiService = createAIService(config, logger) }) {
  const repository = new AuditRepository();
  const auditService = new AuditService({ repository, logger });
  const similarityService = new SimilarityService({ repository });
  const controller = new AuditController({ auditService, similarityService });
  const createWorker = (overrides = {}) =>
    new AIWorkerService({
      repository,
      aiService,
      logger,
      concurrency: config.WORKER_CONCURRENCY,
      pollIntervalMs: POLL_INTERVAL_MS,
      ...overrides,
    });
  return { repository, auditService, similarityService, controller, createWorker };
}
