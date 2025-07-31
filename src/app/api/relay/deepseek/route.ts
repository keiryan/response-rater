export const runtime = "edge";

export async function POST(req: Request) {
  const userKey = req.headers.get("x-user-api-key");
  if (!userKey) {
    return new Response("Missing x-user-api-key", { status: 400 });
  }

  try {
    const body = await req.text();

    const upstream = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userKey}`,
          "Content-Type": "application/json",
        },
        body,
      }
    );

    if (!upstream.ok) {
      const errorText = await upstream.text();
      return new Response(
        `DeepSeek API error: ${upstream.status} ${errorText}`,
        {
          status: upstream.status,
        }
      );
    }

    // Stream the response back to the client
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Relay error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
