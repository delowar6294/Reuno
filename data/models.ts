/**
 * Featured model IDs on the home page. Names and prices are fetched live from
 * OpenRouter (https://openrouter.ai/api/v1/models); an ID that OpenRouter no
 * longer lists is simply not shown.
 */
export const FEATURED_MODEL_IDS = [
  "anthropic/claude-fable-5.2",
  "openai/gpt-6.1-terra",
  "google/gemini-omni-1.2-flash",
  "x-ai/grok-4.7",
  "deepseek/deepseek-v4.1-flash",
  "qwen/qwen3.8-max-prime",
];

export const MODELS_CAPTION = "Live prices from OpenRouter, refreshed hourly. Billed at provider list price with no markup.";
