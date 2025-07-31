export { sendPromptOpenAI } from "./openai";
export { sendPromptAnthropic } from "./anthropic";
export { sendPromptDeepSeek } from "./deepseek";

import { ProviderName, SendPromptArgs, StreamHandler } from "@/lib/types";
import { sendPromptOpenAI } from "./openai";
import { sendPromptAnthropic } from "./anthropic";
import { sendPromptDeepSeek } from "./deepseek";

const adapters = {
  openai: sendPromptOpenAI,
  anthropic: sendPromptAnthropic,
  deepseek: sendPromptDeepSeek,
  openai_compatible: sendPromptOpenAI, // Use OpenAI adapter for compatible APIs
};

export function sendPrompt(
  provider: ProviderName,
  args: SendPromptArgs,
  stream: StreamHandler
) {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`No adapter found for provider: ${provider}`);
  }
  return adapter(args, stream);
}
