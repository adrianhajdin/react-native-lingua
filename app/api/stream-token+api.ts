import { createHmac } from "crypto";

function base64urlEncode(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateStreamToken(userId: string, secret: string): string {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const payload = base64urlEncode(JSON.stringify({ user_id: userId, iat, exp }));
  const signingInput = `${header}.${payload}`;
  const sig = createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `${signingInput}.${sig}`;
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  const secret = process.env.STREAM_API_SECRET;
  const apiKey = process.env.STREAM_API_KEY;

  if (!secret || !apiKey) {
    return Response.json({ error: "Stream not configured" }, { status: 500 });
  }

  const token = generateStreamToken(userId, secret);
  return Response.json({ token, apiKey });
}
