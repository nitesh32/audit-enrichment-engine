import { createServer } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PROVIDER, VECTOR_DIM } from '../../src/config/constants.js';
import { AIService } from '../../src/services/ai/AIService.js';
import { MockAIProvider } from '../../src/services/ai/MockAIProvider.js';
import { OpenRouterProvider } from '../../src/services/ai/OpenRouterProvider.js';

const silentLogger = { warn() {}, info() {}, error() {} };
const entry = {
  evidenceId: 'EVID-1',
  monetaryImpact: 85000,
  description: 'Manual approval override for vendor invoice',
  controlId: 'CTRL-FIN-302',
  timestamp: '2026-07-21T10:00:00.000Z',
};
const validReply = { riskScore: 81.6, aiSummary: 'Large manual override.', anomalyFlags: ['MANUAL_OVERRIDE'] };

/** A tiny stand-in for OpenRouter's /chat/completions endpoint. */
function startFakeOpenRouter() {
  const state = { requests: [], respond: () => ({ status: 200, body: {} }) };
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => {
      state.requests.push({ url: request.url, authorization: request.headers.authorization, body: JSON.parse(body) });
      const { status, body: payload } = state.respond();
      response.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(payload));
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, state, url: `http://127.0.0.1:${server.address().port}/api/v1` })));
}

const completionWith = (content) => ({ status: 200, body: { choices: [{ message: { role: 'assistant', content } }] } });

describe('OpenRouterProvider', () => {
  let fake;
  let provider;

  beforeAll(async () => {
    fake = await startFakeOpenRouter();
    provider = new OpenRouterProvider({ apiKey: 'test-key', model: 'openai/gpt-4o-mini', baseURL: fake.url });
  });
  afterAll(() => fake.server.close());
  beforeEach(() => {
    fake.state.requests.length = 0;
  });

  it('calls /chat/completions with the key and model, and returns a validated, rounded result', async () => {
    fake.state.respond = () => completionWith(JSON.stringify(validReply));
    const result = await provider.analyze(entry);

    expect(result).toEqual({ riskScore: 82, aiSummary: 'Large manual override.', anomalyFlags: ['MANUAL_OVERRIDE'] });
    const [request] = fake.state.requests;
    expect(request.url).toBe('/api/v1/chat/completions');
    expect(request.authorization).toBe('Bearer test-key');
    expect(request.body.model).toBe('openai/gpt-4o-mini');
    expect(JSON.parse(request.body.messages[1].content)).toMatchObject({ monetaryImpact: 85000, controlId: 'CTRL-FIN-302' });
  });

  it('accepts JSON wrapped in a code fence or surrounding prose', async () => {
    fake.state.respond = () => completionWith(`Here you go:\n\`\`\`json\n${JSON.stringify(validReply)}\n\`\`\``);
    expect((await provider.analyze(entry)).riskScore).toBe(82);
  });

  it.each([
    ['text with no JSON', 'I cannot help with that'],
    ['a score out of range', JSON.stringify({ ...validReply, riskScore: 140 })],
    ['a missing summary', JSON.stringify({ riskScore: 50, anomalyFlags: [] })],
  ])('rejects %s', async (_name, content) => {
    fake.state.respond = () => completionWith(content);
    await expect(provider.analyze(entry)).rejects.toThrow();
  });

  it.each([
    ['different casing', ['manual override']],
    ['title case with a space', ['Manual Override']],
    ['a hyphen', ['manual-override']],
    ['surrounding spaces', ['  MANUAL_OVERRIDE ']],
  ])('normalizes a flag written with %s', async (_name, flags) => {
    fake.state.respond = () => completionWith(JSON.stringify({ ...validReply, anomalyFlags: flags }));
    expect((await provider.analyze(entry)).anomalyFlags).toEqual(['MANUAL_OVERRIDE']);
  });

  it('drops unknown and repeated flags but keeps the valid ones and the rest of the reply', async () => {
    const flags = ['Manual Override', 'MANUAL_OVERRIDE', 'SUSPICIOUS_VENDOR', 'round amount'];
    fake.state.respond = () => completionWith(JSON.stringify({ ...validReply, anomalyFlags: flags }));
    expect(await provider.analyze(entry)).toEqual({ riskScore: 82, aiSummary: 'Large manual override.', anomalyFlags: ['MANUAL_OVERRIDE', 'ROUND_AMOUNT'] });
  });

  it('treats a reply with no flags field as no flags', async () => {
    fake.state.respond = () => completionWith(JSON.stringify({ riskScore: 30, aiSummary: 'Looks routine.' }));
    expect((await provider.analyze(entry)).anomalyFlags).toEqual([]);
  });

  it('still rejects flags that are not text', async () => {
    fake.state.respond = () => completionWith(JSON.stringify({ ...validReply, anomalyFlags: [{ flag: 'MANUAL_OVERRIDE' }] }));
    await expect(provider.analyze(entry)).rejects.toThrow();
  });

  it('surfaces HTTP errors with their status so AIService can retry or fall back', async () => {
    fake.state.respond = () => ({ status: 429, body: { error: { message: 'rate limited' } } });
    await expect(provider.analyze(entry)).rejects.toMatchObject({ status: 429 });
  });
});

describe('AIService with a real-AI provider', () => {
  const build = (provider) =>
    new AIService({ provider, fallbackProvider: new MockAIProvider({ delayMs: 0 }), logger: silentLogger, maxConcurrency: 2 });

  it('uses the provider result and builds the semantic vector locally', async () => {
    const provider = { name: PROVIDER.OPENROUTER, analyze: async () => ({ riskScore: 90, aiSummary: 'ok', anomalyFlags: [] }) };
    const result = await build(provider).enrich(entry);

    expect(result).toMatchObject({ provider: PROVIDER.OPENROUTER, riskScore: 90, riskLevel: 'HIGH' });
    expect(result.semanticVector).toHaveLength(VECTOR_DIM);
  });

  it('falls back to the mock engine, tagged mock-fallback, when the provider fails', async () => {
    const provider = { name: PROVIDER.OPENROUTER, analyze: async () => { throw new Error('model unavailable'); } };
    const result = await build(provider).enrich(entry);

    expect(result.provider).toBe(PROVIDER.MOCK_FALLBACK);
    expect(result.anomalyFlags).toContain('MONETARY_THRESHOLD_EXCEEDED');
    expect(result.semanticVector).toHaveLength(VECTOR_DIM);
  });

  it('gives the same vector for the same description whichever provider scored it', async () => {
    const llm = { name: PROVIDER.OPENROUTER, analyze: async () => ({ riskScore: 10, aiSummary: 'ok', anomalyFlags: [] }) };
    const viaLlm = await build(llm).enrich(entry);
    const viaMock = await build(new MockAIProvider({ delayMs: 0 })).enrich(entry);
    expect(viaLlm.semanticVector).toEqual(viaMock.semanticVector);
  });
});
