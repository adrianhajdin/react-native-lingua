const AGENT_URL = process.env.VISION_AGENT_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request): Promise<Response> {
  let body: { callId?: string; callType?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { callId, callType = "default" } = body;

  if (!callId) {
    return Response.json({ error: "callId is required" }, { status: 400 });
  }

  console.log(
    `[agent-session] Starting session for call ${callId} at ${AGENT_URL}`,
  );

  try {
    const res = await fetch(
      `${AGENT_URL}/calls/${encodeURIComponent(callId)}/sessions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_type: callType }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(
        `[agent-session] Vision agent returned ${res.status}: ${text}`,
      );
      return Response.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    console.log(`[agent-session] Session started: ${data.session_id}`);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[agent-session] Failed to reach vision agent at ${AGENT_URL}: ${message}`,
    );
    return Response.json(
      { error: `Cannot reach vision agent: ${message}` },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get("callId");
  const sessionId = searchParams.get("sessionId");

  if (!callId || !sessionId) {
    return Response.json(
      { error: "callId and sessionId are required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${AGENT_URL}/calls/${encodeURIComponent(callId)}/sessions/${encodeURIComponent(sessionId)}`,
      { method: "DELETE" },
    );

    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      return Response.json({ error: text }, { status: res.status });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[agent-session] DELETE failed: ${message}`);
    return Response.json(
      { error: "Failed to reach vision agent" },
      { status: 503 },
    );
  }

  return Response.json({ ok: true });
}
