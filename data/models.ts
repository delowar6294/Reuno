// PLACEHOLDER PRICES — verify against provider before launch
// DEMO DATA — replace with live source

export type Model = {
  name: string;
  id: string;
  provider: string;
  input: string;
  output: string;
  featured?: boolean;
};

export const MODELS: Model[] = [
  { name: "Claude Fable 5.2", id: "anthropic/claude-fable-5.2", provider: "Anthropic", input: "$—", output: "$—", featured: true },
  { name: "GPT-6.1 Terra", id: "openai/gpt-6.1-terra", provider: "OpenAI", input: "$—", output: "$—", featured: true },
  { name: "Gemini Omni 1.2 Flash", id: "google/gemini-omni-1.2-flash", provider: "Google", input: "$—", output: "$—", featured: true },
  { name: "Grok 4.7", id: "x-ai/grok-4.7", provider: "xAI", input: "$—", output: "$—", featured: true },
  { name: "DeepSeek V4.1 Flash", id: "deepseek/deepseek-v4.1-flash", provider: "DeepSeek", input: "$—", output: "$—", featured: true },
  { name: "Qwen3.8 Max Prime", id: "qwen/qwen3.8-max-prime", provider: "Qwen", input: "$—", output: "$—", featured: true },
  { name: "Claude Opus 5.5", id: "anthropic/claude-opus-5.5", provider: "Anthropic", input: "$—", output: "$—" },
  { name: "Claude Haiku 5.5", id: "anthropic/claude-haiku-5.5", provider: "Anthropic", input: "$—", output: "$—" },
  { name: "GPT-6.1 Mini", id: "openai/gpt-6.1-mini", provider: "OpenAI", input: "$—", output: "$—" },
  { name: "Gemini Omni 1.2 Pro", id: "google/gemini-omni-1.2-pro", provider: "Google", input: "$—", output: "$—" },
  { name: "Llama 5 70B", id: "meta/llama-5-70b", provider: "Meta", input: "$—", output: "$—" },
  { name: "Mistral Large 4", id: "mistral/mistral-large-4", provider: "Mistral", input: "$—", output: "$—" },
];

export const MODELS_CAPTION = "example pricing, billed at provider list price with no markup";
