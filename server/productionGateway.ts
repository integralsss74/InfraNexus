import { createHmac } from "node:crypto";

export type GatewayIdentity = {
  id: number;
  openId: string;
  role: "user" | "admin";
};

const MAX_ASSERTION_LIFETIME_SECONDS = 300;

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function createProductionGatewayAssertion(identity: GatewayIdentity, nowSeconds = Math.floor(Date.now() / 1000), ttlSeconds = 120) {
  const secret = process.env.PAIMANA_PRODUCTION_GATEWAY_SECRET;
  if (!secret || secret.length < 32) throw new Error("PAIMANA_PRODUCTION_GATEWAY_SECRET must contain at least 32 characters");
  if (ttlSeconds <= 0 || ttlSeconds > MAX_ASSERTION_LIFETIME_SECONDS) throw new Error("Gateway assertion lifetime must be between 1 and 300 seconds");
  const encoded = encode({ uid: identity.id, sub: identity.openId, role: identity.role, iat: nowSeconds, exp: nowSeconds + ttlSeconds });
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export async function verifyProductionGateway(serviceUrl: string, identity: GatewayIdentity) {
  const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/auth/verify`, {
    headers: { "X-PAIMANA-Assertion": createProductionGatewayAssertion(identity) },
  });
  if (!response.ok) throw new Error(`FastAPI gateway verification failed with ${response.status}`);
  return response.json() as Promise<{ authenticated: boolean; userId: number; role: "user" | "admin" }>;
}

export async function requestProductionGateway<T>(serviceUrl: string, identity: GatewayIdentity, path: string, options: { method?: "GET" | "POST"; body?: unknown } = {}) {
  const response = await fetch(`${serviceUrl.replace(/\/$/, "")}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "X-PAIMANA-Assertion": createProductionGatewayAssertion(identity),
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(3000),
  });
  const payload = await response.json().catch(() => ({})) as { detail?: string } & T;
  if (!response.ok) throw new Error(payload.detail || `FastAPI production gateway request failed with ${response.status}`);
  return payload as T;
}

export function configuredProductionGatewayUrl() {
  const serviceUrl = process.env.PAIMANA_PRODUCTION_API_URL ?? process.env.ML_SERVICE_URL;
  if (!serviceUrl) throw new Error("Optional FastAPI production gateway is not configured; the managed synthetic demo remains available.");
  return serviceUrl;
}
