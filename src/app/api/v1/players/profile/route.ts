import { NextRequest } from "next/server";
import { collectPlayerProfile } from "@/features/player-profile/application/collect-player-profile";
import { PrismaPlayerProfileRepository } from "@/features/player-profile/infrastructure/prisma-player-profile-repository";
import { parseRiotId } from "@/features/player-search/domain/riot-id";
import { RiotApiClient, RiotApiError } from "@/server/riot/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "Envie um corpo JSON válido.");
  }

  if (typeof body !== "object" || body === null || !("riotId" in body)) {
    return errorResponse(
      400,
      "INVALID_REQUEST",
      "Informe o Riot ID e a região.",
    );
  }

  const riotId =
    typeof body.riotId === "string" ? parseRiotId(body.riotId) : null;
  if (!riotId) {
    return errorResponse(
      400,
      "INVALID_RIOT_ID",
      "Informe o Riot ID no formato Nome#TAG.",
    );
  }

  const region =
    "region" in body && typeof body.region === "string"
      ? body.region.toLowerCase()
      : "br";
  if (region !== "br") {
    return errorResponse(
      400,
      "UNSUPPORTED_REGION",
      "No momento, a busca está disponível apenas para a região BR.",
    );
  }

  try {
    const profile = await collectPlayerProfile(
      riotId,
      new RiotApiClient(),
      new PrismaPlayerProfileRepository(),
    );

    return Response.json(
      {
        data: {
          gameName: profile.gameName,
          tagLine: profile.tagLine,
          profileIconId: profile.profileIconId,
          summonerLevel: profile.summonerLevel,
          rankedEntries: profile.rankedEntries,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof RiotApiError && error.status === 404) {
      return errorResponse(
        404,
        "PLAYER_NOT_FOUND",
        "Não encontramos esse jogador ou o perfil ainda não está disponível. Confira o nome, a tag e a região.",
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
        "A Riot rejeitou a chave de API configurada no servidor. Verifique a chave e tente novamente.",
      );
    }

    if (error instanceof RiotApiError && error.status === 429) {
      return errorResponse(
        429,
        "RIOT_RATE_LIMITED",
        "A busca está temporariamente ocupada. Tente novamente em alguns instantes.",
      );
    }

    console.error("Player profile collection failed.", error);
    return errorResponse(
      503,
      "PROFILE_COLLECTION_FAILED",
      "Não foi possível carregar os dados do perfil agora. Tente novamente mais tarde.",
    );
  }
}
