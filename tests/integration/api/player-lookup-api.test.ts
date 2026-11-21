import assert from "node:assert/strict";
import { test } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../../../src/app/api/v1/players/lookup/route";

const originalApiKey = process.env.RIOT_API_KEY;
const originalFetch = globalThis.fetch;

function request(riotId: string, region = "br"): NextRequest {
  const params = new URLSearchParams({ riotId, region });
  return new NextRequest(`http://localhost/api/v1/players/lookup?${params}`);
}

test("looks up an existing Riot ID without exposing its PUUID", async () => {
  process.env.RIOT_API_KEY = "test-key";
  let requestedUrl = "";
  let authorizationToken: string | null = null;
  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    authorizationToken = new Headers(init?.headers).get("X-Riot-Token");
    return Response.json({
      puuid: "account-puuid",
      gameName: "Ahri Main",
      tagLine: "BR1",
    });
  };

  try {
    const response = await GET(request("Ahri Main#BR1"));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.deepEqual(await response.json(), {
      data: {
        gameName: "Ahri Main",
        tagLine: "BR1",
      },
    });
    assert.equal(
      requestedUrl,
      "https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Ahri%20Main/BR1",
    );
    assert.equal(authorizationToken, "test-key");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RIOT_API_KEY;
    else process.env.RIOT_API_KEY = originalApiKey;
  }
});

test("returns a friendly not-found response for an unknown Riot ID", async () => {
  process.env.RIOT_API_KEY = "test-key";
  globalThis.fetch = async () => new Response(null, { status: 404 });

  try {
    const response = await GET(request("UnknownPlayer#BR1"));
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: "PLAYER_NOT_FOUND",
        message: "Não encontramos esse jogador. Confira o nome, a tag e a região.",
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RIOT_API_KEY;
    else process.env.RIOT_API_KEY = originalApiKey;
  }
});

test("explains when Riot rejects the configured API key without exposing it", async () => {
  process.env.RIOT_API_KEY = "test-key";
  globalThis.fetch = async () => new Response(null, { status: 401 });

  try {
    const response = await GET(request("OP LORD ARKYN #br1"));
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.deepEqual(body, {
      error: {
        code: "RIOT_API_AUTH_FAILED",
        message:
          "A Riot rejeitou a chave enviada pelo servidor. Confirme se a chave completa e ativa do Developer Portal está em RIOT_API_KEY no .env da raiz e reinicie o Next.js.",
      },
    });
    assert.equal(JSON.stringify(body).includes("test-key"), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RIOT_API_KEY;
    else process.env.RIOT_API_KEY = originalApiKey;
  }
});

test("returns a friendly response when Riot rate-limits a lookup", async () => {
  process.env.RIOT_API_KEY = "test-key";
  globalThis.fetch = async () =>
    new Response(null, {
      status: 429,
      headers: { "Retry-After": "0.001" },
    });

  try {
    const response = await GET(request("Ahri Main#BR1"));
    assert.equal(response.status, 429);
    assert.deepEqual(await response.json(), {
      error: {
        code: "RIOT_RATE_LIMITED",
        message:
          "A busca está temporariamente ocupada. Estamos consultando a Riot; tente novamente em alguns instantes.",
      },
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RIOT_API_KEY;
    else process.env.RIOT_API_KEY = originalApiKey;
  }
});

test("rejects malformed Riot IDs before calling Riot", async () => {
  process.env.RIOT_API_KEY = "test-key";
  let riotWasCalled = false;
  globalThis.fetch = async () => {
    riotWasCalled = true;
    return Response.json({});
  };

  try {
    for (const riotId of ["WithoutTag", "#BR1", "Player#", "Player#BR1#extra"]) {
      const response = await GET(request(riotId));
      assert.equal(response.status, 400, riotId);
      assert.deepEqual(await response.json(), {
        error: {
          code: "INVALID_RIOT_ID",
          message: "Informe o Riot ID no formato Nome#TAG.",
        },
      });
    }
    assert.equal(riotWasCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RIOT_API_KEY;
    else process.env.RIOT_API_KEY = originalApiKey;
  }
});

test("rejects regions that are not enabled before calling Riot", async () => {
  process.env.RIOT_API_KEY = "test-key";
  let riotWasCalled = false;
  globalThis.fetch = async () => {
    riotWasCalled = true;
    return Response.json({});
  };

  try {
    const response = await GET(request("Ahri Main#BR1", "euw"));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: {
        code: "UNSUPPORTED_REGION",
        message: "No momento, a busca está disponível apenas para a região BR.",
      },
    });
    assert.equal(riotWasCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RIOT_API_KEY;
    else process.env.RIOT_API_KEY = originalApiKey;
  }
});
