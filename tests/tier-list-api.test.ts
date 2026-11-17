import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../src/app/api/v1/tier-list/route";

test("tier-list endpoint rejects unsupported filters without caching errors", async () => {
  const cases = [
    "regiao=na",
    "funcao=carry",
    "elo=challenger",
    "patch=not-a-patch",
  ];

  for (const query of cases) {
    const response = await GET(
      new NextRequest(`http://localhost/api/v1/tier-list?${query}`),
    );
    assert.equal(response.status, 400, query);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.ok((await response.json()).error);
  }
});
