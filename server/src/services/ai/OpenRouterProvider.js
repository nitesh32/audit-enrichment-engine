import OpenAI from 'openai';
import { z } from 'zod';
import { AI_REQUEST_TIMEOUT_MS, ANOMALY_FLAG, OPENROUTER_BASE_URL, PROVIDER } from '../../config/constants.js';

const analysisSchema = z.object({
  riskScore: z.number().min(0).max(100).transform(Math.round),
  aiSummary: z.string().min(1),
  anomalyFlags: z.array(z.enum(Object.values(ANOMALY_FLAG))),
});

const SYSTEM_PROMPT = `You are an audit risk analyst. Reply with one JSON object only, no other text:
{"riskScore": integer 0-100, "aiSummary": 1-2 sentences on why this is an audit risk,
"anomalyFlags": subset of ${JSON.stringify(Object.values(ANOMALY_FLAG))}}`;

/** Models sometimes wrap JSON in code fences or prose; take the outermost object. */
function parseJsonReply(reply) {
  const start = reply.indexOf('{');
  const end = reply.lastIndexOf('}');
  if (start === -1 || end < start) throw new Error('AI reply contained no JSON object');
  return JSON.parse(reply.slice(start, end + 1));
}

/**
 * Risk analysis through OpenRouter (an OpenAI-compatible API, so the openai SDK is
 * pointed at its URL). Errors, including invalid output, bubble up to AIService.
 */
export class OpenRouterProvider {
  name = PROVIDER.OPENROUTER;

  constructor({ apiKey, model, baseURL = OPENROUTER_BASE_URL }) {
    this.model = model;
    this.client = new OpenAI({ apiKey, baseURL, timeout: AI_REQUEST_TIMEOUT_MS, maxRetries: 0 });
  }

  /**
   * @returns {Promise<{ riskScore: number, aiSummary: string, anomalyFlags: string[] }>}
   * @throws when the API call fails or the reply does not match the schema
   */
  async analyze({ monetaryImpact, description, controlId, timestamp }) {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ monetaryImpact, description, controlId, timestamp }) },
      ],
    });
    return analysisSchema.parse(parseJsonReply(completion.choices[0].message.content ?? ''));
  }
}
