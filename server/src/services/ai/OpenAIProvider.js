import OpenAI from 'openai';
import { z } from 'zod';
import { AI_REQUEST_TIMEOUT_MS, ANOMALY_FLAG, EMBEDDING_MODEL, PROVIDER, VECTOR_DIM } from '../../config/constants.js';

const analysisSchema = z.object({
  riskScore: z.number().min(0).max(100),
  aiSummary: z.string().min(1),
  anomalyFlags: z.array(z.enum(Object.values(ANOMALY_FLAG))),
});

const SYSTEM_PROMPT = `You are an audit risk analyst. Reply with JSON only:
{"riskScore": integer 0-100, "aiSummary": 1-2 sentences on why this is an audit risk,
"anomalyFlags": subset of ${JSON.stringify(Object.values(ANOMALY_FLAG))}}`;

/** Live LLM provider. Errors (including invalid output) bubble up to AIService. */
export class OpenAIProvider {
  name = PROVIDER.OPENAI;

  constructor({ apiKey, model }) {
    this.model = model;
    this.client = new OpenAI({ apiKey, timeout: AI_REQUEST_TIMEOUT_MS, maxRetries: 0 });
  }

  /** @throws when the API call fails or the reply does not match the schema */
  async analyze({ monetaryImpact, description, controlId }) {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify({ monetaryImpact, description, controlId }) },
      ],
    });
    return analysisSchema.parse(JSON.parse(completion.choices[0].message.content));
  }

  async embed(text) {
    const response = await this.client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: VECTOR_DIM,
    });
    return response.data[0].embedding;
  }
}
