import { NextRequest } from "next/server";
import { parseRiotId } from "@/features/player-search/domain/riot-id";
import { RiotApiClient, RiotApiError } from "@/server/riot/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

const accountRoutingByRegion = {
  br: "https://americas.api.riotgames.com",
} as const;

function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json(
    { error: { code, message } },
    {
      status,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const riotId = parseRiotId(request.nextUrl.searchParams.get("riotId"));
  if (!riotId) {
    return errorResponse(
      400,
      "INVALID_RIOT_ID",
      "Informe o Riot ID no formato Nome#TAG.",
    );
  }

  const region = request.nextUrl.searchParams.get("region")?.toLowerCase() ?? "br";
  if (region !== "br") {
    return errorResponse(
      400,
      "UNSUPPORTED_REGION",
      "No momento, a busca está disponível apenas para a região BR.",
    );
  }
  const accountRouting = accountRoutingByRegion.br;

  try {
    const account = await new RiotApiClient().get<RiotAccount>(
      `${accountRouting}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(riotId.gameName)}/${encodeURIComponent(riotId.tagLine)}`,
    );
    if (
      typeof account.puuid !== "string" ||
      !account.puuid ||
      typeof account.gameName !== "string" ||
      !account.gameName ||
      typeof account.tagLine !== "string" ||
      !account.tagLine
    ) {
      throw new Error("Riot account response is missing required fields.");
    }

    return Response.json(
      {
        data: {
          gameName: account.gameName,
          tagLine: account.tagLine,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof RiotApiError && error.status === 404) {
      return errorResponse(
        404,
        "PLAYER_NOT_FOUND",
        "Não encontramos esse jogador. Confira o nome, a tag e a região.",
      );
    }

    if (
      error instanceof RiotApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      console.error("Riot API rejected the configured credentials.", error);
      return errorResponse(
        503,
        "RIOT_API_AUTH_FAILED",
        "A Riot rejeitou a chave enviada pelo servidor. Confirme se a chave completa e ativa do Developer Portal está em RIOT_API_KEY no .env da raiz e reinicie o Next.js.",
      );
    }

    if (error instanceof RiotApiError && error.status === 429) {
      return errorResponse(
        429,
        "RIOT_RATE_LIMITED",
        "A busca está temporariamente ocupada. Estamos consultando a Riot; tente novamente em alguns instantes.",
      );
    }

    console.error("Riot ID lookup failed.", error);
    return errorResponse(
      503,
      "RIOT_API_UNAVAILABLE",
      "Não foi possível consultar a Riot agora. Tente novamente mais tarde.",
    );
  }
}
