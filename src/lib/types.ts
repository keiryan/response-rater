export type ProviderName =
  | "openai"
  | "anthropic"
  | "deepseek"
  | "openai_compatible";

export interface ProviderSettings {
  apiKey: string;
  baseUrl?: string; // for openai_compatible
  transport?: "direct" | "relay"; // default: 'direct'
}

export interface ModelSettings {
  id: string; // e.g., "gpt-4o-mini", "claude-3-5-sonnet", "deepseek-chat"
  label: string; // human-readable
  provider: ProviderName;
  temperature?: number; // default per model
  maxTokens?: number;
  enabled: boolean;
}

export interface RunConfig {
  systemPrompt?: string; // NEW: optional per-run system prompt
  question: string;
  loopCount: number; // [1..loopCap], default 5
  selectedModelIds: string[];
  concurrency: number; // default 3
  createdAt: string; // ISO
  loopCapAtRunTime: number; // snapshot of current loop cap
}

export interface ResponseRecord {
  id: string;
  runId: string;
  service: ProviderName;
  modelId: string;
  modelLabel: string;
  loopIndex: number;
  status: "queued" | "in_progress" | "done" | "error" | "canceled";
  text: string;
  startedAt?: string;
  completedAt?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  charCount?: number;
  finishReason?: string;
  truncated?: boolean;
  errorMessage?: string;
  retryCount: number;
}

export interface Run {
  id: string;
  config: RunConfig;
  responses: ResponseRecord[];
  stats: {
    total: number;
    completed: number;
    errors: number;
    avgLatencyMs?: number;
  };
  similarity?: {
    pairs: Record<string, Array<{ id: string; score: number }>>;
    clusters?: Array<{ ids: string[] }>;
  };
}

export interface SendPromptArgs {
  model: ModelSettings;
  providerSettings: ProviderSettings;
  systemPrompt?: string; // NEW
  prompt: string; // the user's question
  temperature?: number;
  maxTokens?: number;
  abortSignal?: AbortSignal;
  transport?: "direct" | "relay";
}

export interface StreamHandler {
  onStart?: () => void;
  onChunk?: (data: { text: string }) => void;
  onComplete?: (
    fullText: string,
    metadata: { latencyMs?: number; totalTokens?: number }
  ) => void;
  onError?: (error: string) => void;
}
