import { expect, test } from "@playwright/test";

const entries = [
  {
    championId: "Annie",
    name: "Annie",
    englishName: "Annie",
    role: "MID",
    tier: "A",
    score: 82,
    winRate: 52,
    pickRate: 10,
    banRate: 5,
    kda: 2.5,
    games: 60,
    roleRate: 80,
    tierChange: "UP",
    difficulty: 4,
  },
  {
    championId: "Garen",
    name: "Garen",
    englishName: "Garen",
    role: "TOP",
    tier: "B",
    score: 55,
    winRate: 50,
    pickRate: 8,
    banRate: 3,
    kda: 2,
    games: 60,
    roleRate: 80,
    tierChange: "DOWN",
    difficulty: 5,
  },
];

test("CT-04 filters the tier list and shows patch changes in both views", async ({
  page,
}) => {
  const observedFilters: Array<{
    role: string | null;
    elo: string | null;
    patch: string | null;
  }> = [];

  await page.route("**/api/v1/tier-list**", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const role = params.get("funcao");
    const elo = params.get("elo");
    const patch = params.get("patch");
    observedFilters.push({ role, elo, patch });

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: entries.filter((entry) => !role || role === "all" || entry.role.toLowerCase() === role),
        meta: {
          patch: patch ?? "16.23",
          availablePatches: ["16.23", "16.22"],
          matchesInDatabase: 60,
          minimumGames: 50,
          preliminary: false,
        },
      }),
    });
  });

  await page.goto("/tier-list/");
  await expect(page.getByRole("heading", { name: "Tier List" })).toBeVisible();
  await expect(page.getByText("Annie", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Meio", exact: true }).click();
  await page.getByLabel("Faixa de elo").selectOption("diamond");
  await page.getByLabel("Patch", { exact: true }).selectOption("16.23");

  await expect
    .poll(() =>
      observedFilters.some(
        ({ role, elo, patch }) =>
          role === "mid" && elo === "diamond" && patch === "16.23",
      ),
    )
    .toBe(true);
  await expect(page.getByText("Annie", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Garen", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Comparar patch" }).click();
  await expect(
    page.getByRole("img", {
      name: "Pontuação subiu em relação ao patch anterior",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Visualizar em tabela" }).click();
  await expect(
    page.getByRole("columnheader", { name: "Variação" }),
  ).toBeVisible();
  await expect(page.getByText("↑ UP")).toBeVisible();
});
