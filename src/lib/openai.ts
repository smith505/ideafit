import OpenAI from 'openai'

// Lazy-loaded OpenAI client (prevents build-time initialization)
let openaiClient: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// Cost tracking (for monitoring)
export function estimateCost(inputTokens: number, outputTokens: number): number {
  // GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output
  const inputCost = (inputTokens / 1_000_000) * 0.15
  const outputCost = (outputTokens / 1_000_000) * 0.60
  return inputCost + outputCost
}
