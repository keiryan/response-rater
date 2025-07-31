import { SendPromptArgs, StreamHandler } from "@/lib/types";
import { parseAnthropicSSE } from "@/lib/sse/parse";

export async function sendPromptAnthropic(
  args: SendPromptArgs,
  stream: StreamHandler
) {
  const {
    model,
    providerSettings,
    systemPrompt,
    prompt,
    temperature,
    maxTokens,
    abortSignal,
    transport = "direct",
  } = args;

  const url =
    transport === "relay"
      ? "/api/relay/anthropic"
      : "https://api.anthropic.com/v1/messages";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
  };

  if (transport === "direct") {
    headers["x-api-key"] = providerSettings.apiKey;
  } else {
    headers["x-user-api-key"] = providerSettings.apiKey;
  }

  const body: Record<string, unknown> = {
    model: model.id,
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens ?? model.maxTokens ?? 4096,
    temperature: temperature ?? model.temperature ?? 0.7,
    stream: true,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
    }

    const started = performance.now();
    let fullText = "";
    let totalTokens: number | undefined;

    stream.onStart?.();

    await parseAnthropicSSE(
      response,
      (json) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const delta = (json as any)?.delta?.text ?? "";
        if (delta) {
          fullText += delta;
          stream.onChunk?.({ text: delta });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((json as any)?.usage) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          totalTokens =
            (json as any).usage.input_tokens +
            (json as any).usage.output_tokens;
        }
      },
      () => {
        const latencyMs = Math.round(performance.now() - started);
        stream.onComplete?.(fullText, {
          latencyMs,
          totalTokens,
        });
      }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      stream.onError?.("Request was canceled");
    } else {
      stream.onError?.(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
}
