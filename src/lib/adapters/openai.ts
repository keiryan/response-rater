import { SendPromptArgs, StreamHandler } from "@/lib/types";
import { parseSSE } from "@/lib/sse/parse";

export async function sendPromptOpenAI(
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
      ? "/api/relay/openai"
      : "https://api.openai.com/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (transport === "direct") {
    headers.Authorization = `Bearer ${providerSettings.apiKey}`;
  } else {
    headers["x-user-api-key"] = providerSettings.apiKey;
  }

  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    { role: "user", content: prompt },
  ];

  const body = {
    model: model.id,
    messages,
    temperature: temperature ?? model.temperature ?? 0.7,
    max_tokens: maxTokens ?? model.maxTokens,
    stream: true,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const started = performance.now();
    let fullText = "";
    let totalTokens: number | undefined;

    stream.onStart?.();

    await parseSSE(
      response,
      (json) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const delta = (json as any)?.choices?.[0]?.delta?.content ?? "";
        if (delta) {
          fullText += delta;
          stream.onChunk?.({ text: delta });
        }

        // Capture token usage if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((json as any)?.usage) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          totalTokens = (json as any).usage.total_tokens;
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
