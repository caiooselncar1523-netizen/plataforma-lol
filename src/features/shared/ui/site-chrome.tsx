"use client";

import { useState } from "react";

type SiteHeaderProps = {
  active: "home" | "tier-list";
  hideSearch?: boolean;
};

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 34 34">
        <path d="M17 3 30 10.5v13L17 31 4 23.5v-13L17 3Z" />
        <path d="m10 22 7-14 7 14m-11-5h8" />
      </svg>
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 17 17 5m-8 0h8v8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

export function SiteHeader({ active, hideSearch = false }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Ahriademia, início">
          <BrandMark />
          <span className="brand-word">
            AHRI<span>A</span>DEMIA
          </span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a
            className={`nav-link ${active === "home" ? "nav-link-active" : ""}`}
            href="/"
          >
            Início
          </a>
          <a
            className={`nav-link ${active === "tier-list" ? "nav-link-active" : ""}`}
            href="/tier-list"
          >
            Tier List
          </a>
          <a className="nav-link" href="/#busca">
            Jogadores
          </a>
          <a className="nav-link nav-link-disabled" href="#analises" aria-disabled="true">
            Análises <span>EM BREVE</span>
          </a>
        </nav>
        <div className="header-actions">
          {!hideSearch ? (
            <label className="header-search">
              <SearchIcon />
              <input aria-label="Buscar Riot ID" placeholder="Buscar Riot ID" disabled />
              <span>EM BREVE</span>
            </label>
          ) : null}
          <button
            type="button"
            className="sign-in-button"
            disabled
            title="Login estará disponível em uma fase futura"
          >
            Entrar <ArrowIcon />
          </button>
          <button
            type="button"
            className="mobile-menu icon-button"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <MenuIcon />
          </button>
        </div>
      </header>
      {mobileMenuOpen ? (
        <nav className="mobile-nav-panel" aria-label="Navegação mobile">
          <a href="/" onClick={() => setMobileMenuOpen(false)}>
            Início {active === "home" ? <span>ATUAL</span> : null}
          </a>
          <a href="/tier-list" onClick={() => setMobileMenuOpen(false)}>
            Tier List {active === "tier-list" ? <span>ATUAL</span> : null}
          </a>
          <a href="/#busca" onClick={() => setMobileMenuOpen(false)}>
            Jogadores
          </a>
          <a href="#analises" aria-disabled="true">
            Análises <span>EM BREVE</span>
          </a>
        </nav>
      ) : null}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="footer-brand" href="/">
        <BrandMark />
        <span>
          AHRI<span>A</span>DEMIA
        </span>
      </a>
      <p>Sua academia para evoluir no Rift.</p>
      <p className="riot-disclaimer">
        Ahriademia não é endossado pela Riot Games e não reflete as opiniões de
        pessoas oficialmente envolvidas na produção ou no gerenciamento das
        propriedades da Riot Games. Riot Games e todas as propriedades
        associadas são marcas comerciais ou registradas da Riot Games, Inc.
      </p>
    </footer>
  );
}
