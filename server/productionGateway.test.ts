import { afterEach, describe, expect, it, vi } from "vitest";
import { createProductionGatewayAssertion, requestProductionGateway, verifyProductionGateway } from "./productionGateway";

describe("production gateway assertion", () => {
  const originalSecret = process.env.PAIMANA_PRODUCTION_GATEWAY_SECRET;

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env.PAIMANA_PRODUCTION_GATEWAY_SECRET = originalSecret;
  });

  it("uses the configured secret to call the FastAPI verification endpoint with a short-lived signed assertion", async () => {
    expect(process.env.PAIMANA_PRODUCTION_GATEWAY_SECRET?.length ?? 0).toBeGreaterThanOrEqual(32);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ authenticated: true, userId: 9, role: "admin" }) });
    vi.stubGlobal("fetch", fetchMock);

    const response = await verifyProductionGateway("http://ml-api:8010", { id: 9, openId: "owner-open-id", role: "admin" });
    expect(response).toEqual({ authenticated: true, userId: 9, role: "admin" });
    const [, request] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://ml-api:8010/auth/verify");
    expect(request.headers["X-PAIMANA-Assertion"]).toBe(createProductionGatewayAssertion({ id: 9, openId: "owner-open-id", role: "admin" }));
  });

  it("proxies a protected production write with a server-side assertion and never requires browser credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 7, project_id: "P-0004" }) });
    vi.stubGlobal("fetch", fetchMock);
    const result = await requestProductionGateway("http://ml-api:8010", { id: 9, openId: "owner-open-id", role: "admin" }, "/coordinates", { method: "POST", body: { projectId: "P-0004", consentConfirmed: true } });
    expect(result).toEqual({ id: 7, project_id: "P-0004" });
    const [url, request] = fetchMock.mock.calls[0] as [string, { method: string; headers: Record<string, string>; body: string }];
    expect(url).toBe("http://ml-api:8010/coordinates");
    expect(request.method).toBe("POST");
    expect(request.headers["X-PAIMANA-Assertion"]).toBeDefined();
    expect(JSON.parse(request.body)).toEqual({ projectId: "P-0004", consentConfirmed: true });
  });
});
