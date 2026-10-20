# Veyron

**Evolua além do seu elo**

Plataforma brasileira de análise de League of Legends. O objetivo é transformar
dados de partidas em explicações claras, benchmarks e metas de treino
personalizadas.

## Estado do projeto

O projeto está na preparação da fundação técnica. A implementação do backend,
frontend e banco de dados começa nas tarefas T-014 e T-015 do backlog.

O planejamento completo está em
[documentação/Documento de Requisitos – Plataforma de Análise de League of Legends.md](documentação/Documento%20de%20Requisitos%20%E2%80%93%20Plataforma%20de%20An%C3%A1lise%20de%20League%20of%20Legends.md).

## Stack escolhida

- **Frontend:** Next.js, React, TypeScript e Tailwind CSS
- **Backend:** Python e FastAPI
- **Banco de dados:** PostgreSQL
- **Persistência:** SQLAlchemy e Alembic
- **Cliente Riot:** httpx, encapsulado em um cliente único no backend
- **Cache e filas:** Redis, introduzido quando necessário pelas fases do roadmap
- **Texto das análises:** API de um LLM acessada exclusivamente pelo backend
- **Ambiente local:** Docker e Docker Compose
- **Testes:** pytest, Vitest e Playwright
- **Qualidade:** Ruff, ESLint e Prettier

As escolhas de hospedagem e de provedor de autenticação permanecem abertas até
as tarefas correspondentes do backlog.

## Princípios técnicos

1. Seguir a ordem e as dependências do backlog.
2. Manter a chave da Riot e as chaves de serviços exclusivamente no backend.
3. Identificar jogadores internamente pelo PUUID e exibir o Riot ID na interface.
4. Centralizar todas as chamadas à Riot em um cliente com controle de taxa,
   cache, retry e tratamento explícito de erros.
5. Calcular métricas e diagnósticos com regras testáveis antes de solicitar
   explicações ao LLM.
6. Manter textos em português do Brasil, com tom construtivo e sem humilhar o
   jogador.
7. Criar testes para regras de negócio e cálculos estatísticos.
8. Respeitar as políticas da Riot e a LGPD.

## Desenvolvimento

Os comandos de instalação e execução serão adicionados junto à configuração do
backend e do frontend nas tarefas T-014 e T-015. Nunca copie chaves reais para
arquivos versionados; use o `.env` local baseado em `.env.example`.

## Licença

Este projeto está disponível sob a licença MIT. Consulte [LICENSE](LICENSE).
