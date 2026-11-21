import assert from "node:assert/strict";
import { test } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../../src/app/api/v1/players/profile/route";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/players/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("rejects malformed Riot IDs before requesting Riot or the database", async () => {
  const response = await POST(request({ riotId: "PlayerWithoutTag", region: "br" }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: {
      code: "INVALID_RIOT_ID",
      message: "Informe o Riot ID no formato Nome#TAG.",
    },
  });
});

test("rejects regions that are not enabled before collecting a profile", async () => {
  const response = await POST(
    request({ riotId: "Ahri Main#BR1", region: "euw" }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: {
      code: "UNSUPPORTED_REGION",
      message: "No momento, a busca está disponível apenas para a região BR.",
    },
  });
});
