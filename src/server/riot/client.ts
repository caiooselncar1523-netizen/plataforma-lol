export class RiotApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export class RiotApiClient {
  private lastRequestAt = 0;
  private readonly minimumIntervalMs: number;
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) {
      throw new Error("RIOT_API_KEY must be configured for Riot API requests.");
    }

    this.apiKey = apiKey;
    const configuredInterval = Number(process.env.RIOT_REQUEST_INTERVAL_MS ?? 1200);
    this.minimumIntervalMs =
      Number.isFinite(configuredInterval) && configuredInterval >= 600
        ? configuredInterval
        : 1200;
  }

  async get<T>(url: string): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await this.waitForRateLimit();

      let response: Response;
      try {
        response = await fetch(url, {
          headers: { "X-Riot-Token": this.apiKey },
          cache: "no-store",
        });
      } catch {
        if (attempt === 3) {
          throw new RiotApiError("Could not reach Riot API.", 0);
        }
        await sleep(500 * 2 ** attempt);
        continue;
      }

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (response.status === 429 || response.status >= 500) {
        if (attempt === 3) {
          throw new RiotApiError("Riot API request exceeded retry limit.", response.status);
        }
        const retryAfter = Number(response.headers.get("retry-after"));
        await sleep(
          response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 500 * 2 ** attempt,
        );
        continue;
      }

      throw new RiotApiError(
        `Riot API rejected a request with HTTP ${response.status}.`,
        response.status,
      );
    }

    throw new RiotApiError("Riot API request failed unexpectedly.", 0);
  }

  private async waitForRateLimit(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < this.minimumIntervalMs) {
      await sleep(this.minimumIntervalMs - elapsed);
    }
    this.lastRequestAt = Date.now();
  }
}
