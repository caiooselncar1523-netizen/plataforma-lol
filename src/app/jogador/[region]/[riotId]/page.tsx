import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/features/shared/ui/site-chrome";
import { parseRiotId } from "@/features/player-search/domain/riot-id";

type PlayerPageProps = {
  params: Promise<{
    region: string;
    riotId: string;
  }>;
};

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { region, riotId: encodedRiotId } = await params;
  let riotId: string;
  try {
    riotId = decodeURIComponent(encodedRiotId);
  } catch (error) {
    if (error instanceof URIError) notFound();
    throw error;
  }

  const separator = riotId.lastIndexOf("-");
  if (region !== "br" || separator < 1) notFound();

  const parsedRiotId = parseRiotId(
    `${riotId.slice(0, separator)}#${riotId.slice(separator + 1)}`,
  );
  if (!parsedRiotId) notFound();

  return (
    <main className="home-page player-lookup-page">
      <SiteHeader active="home" />
      <div className="home-shell player-lookup-shell">
        <section className="player-lookup-card" aria-labelledby="player-page-title">
          <p className="home-label">JOGADOR · BR</p>
          <h1 id="player-page-title">
            {parsedRiotId.gameName}
            <span>#{parsedRiotId.tagLine}</span>
          </h1>
          <p className="player-lookup-status">PERFIL ENCONTRADO</p>
          <p className="player-lookup-description">
            Seus dados de nível, ícone e filas ranqueadas foram coletados e
            salvos. A visualização detalhada do perfil chega na próxima etapa.
          </p>
          <div className="player-lookup-links">
            <a className="home-primary-cta" href="/">
              Buscar outro jogador
            </a>
            <a className="home-text-link" href="/tier-list">
              Ver Tier List
            </a>
          </div>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
