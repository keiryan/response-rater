export async function parseSSE(
  response: Response,
  onData: (json: Record<string, unknown>) => void,
  onDone: () => void
) {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let idx;

      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
              onDone();
              return;
            }
            try {
              const json = JSON.parse(payload);
              onData(json);
            } catch (e) {
              // Ignore parsing errors for malformed JSON
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("SSE parsing error:", error);
  } finally {
    onDone();
  }
}

// Specialized parser for Anthropic's event-based streaming
export async function parseAnthropicSSE(
  response: Response,
  onData: (json: Record<string, unknown>) => void,
  onDone: () => void
) {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let idx;

      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const lines = chunk.split("\n");
        let eventType = "";
        let data = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            data = line.slice(5).trim();
          }
        }

        if (data && eventType === "content_block_delta") {
          try {
            const json = JSON.parse(data);
            onData(json);
          } catch (e) {
            // Ignore parsing errors
          }
        } else if (eventType === "message_delta") {
          onDone();
          return;
        }
      }
    }
  } catch (error) {
    console.error("Anthropic SSE parsing error:", error);
  } finally {
    onDone();
  }
}
