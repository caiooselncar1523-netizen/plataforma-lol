# Ahriademia

**Sua academia para evoluir no Rift.**

Plataforma brasileira de análise de League of Legends. O objetivo é transformar
dados de partidas em explicações claras, benchmarks e metas de treino
personalizadas.

## Estado do projeto

O projeto está na preparação da fundação técnica. A implementação do backend,
frontend e banco de dados começa nas tarefas T-014 e T-015 do backlog.

O planejamento e a arquitetura estão no
[documento de requisitos](documentação/Documento%20de%20Requisitos%20%E2%80%93%20Plataforma%20de%20An%C3%A1lise%20de%20League%20of%20Legends%20%281%29.md).

## Stack escolhida

- **Frontend e API:** Next.js, React, TypeScript e Tailwind CSS
- **Worker:** processo Node.js/TypeScript separado, no mesmo repositório
- **Banco e fila:** PostgreSQL, Prisma e pg-boss
- **Cliente Riot:** cliente centralizado usado exclusivamente pelo worker em produção
- **Texto das análises:** API de LLM chamada pelo worker após o cálculo das métricas
- **Ambiente local:** Docker e Docker Compose
- **Testes e qualidade:** Vitest, Playwright, ESLint e Prettier

As escolhas de hospedagem e de provedor de autenticação permanecem abertas até
as tarefas correspondentes do backlog.

## Princípios técnicos

1. Arquitetura inicial: monólito modular para a aplicação web e worker separado para tarefas demoradas; sem microserviços ou Redis até haver necessidade medida.
2. Seguir a ordem e as dependências do backlog.
3. Manter chaves e integrações privilegiadas exclusivamente no servidor.
4. Identificar jogadores internamente pelo PUUID e exibir o Riot ID na interface.
5. Centralizar as chamadas à Riot em produção no worker e tratar limites,
   `Retry-After`, novas tentativas e erros.
6. Calcular métricas e diagnósticos com regras testáveis antes de solicitar explicações ao LLM.
7. Manter textos em português do Brasil, com tom construtivo e sem humilhar o jogador.
8. Respeitar as políticas da Riot e a LGPD.

## Desenvolvimento

Os comandos de instalação e execução serão adicionados junto à configuração da
aplicação e do worker nas tarefas T-014 e T-015. Nunca copie chaves reais para
arquivos versionados; use o `.env` local baseado em `.env.example`.

## Licença

Este projeto está disponível sob a licença MIT. Consulte [LICENSE](LICENSE).
