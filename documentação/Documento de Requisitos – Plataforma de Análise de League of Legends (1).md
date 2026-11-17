# Documento de Requisitos de Software (DRS)

**Projeto:** Ahriademia — Plataforma de Análise de League of Legends **Versão:** 1.6 **Data:** 13/11/2026 **Status:** Pipeline de dados da tier list em implementação

---

## 1. Introdução

### 1.1 Propósito

Este documento descreve os requisitos da plataforma web de League of Legends que une três tipos de funcionalidade: **tier list de campeões** (referência: METAsrc), **perfil, busca e histórico de jogadores** (referência: OP.GG) e **análise de partida ao vivo** (referência: Porofessor). O diferencial do produto é a **análise de erros e acertos com IA**, com foco em ensinar o jogador a melhorar.

### 1.2 Escopo

O sistema será um site (com versão responsiva para celular) que coleta dados da API oficial da Riot Games, calcula estatísticas, gera análises e entrega recomendações em português. Fica **fora do escopo inicial**: aplicativo desktop com overlay, outros jogos (TFT, Valorant) e monetização avançada.

### 1.3 Público-alvo

- **Jogadores casuais:** querem entender o que erraram, de forma simples e visual.
- **Jogadores competitivos:** querem subir de elo, com dados detalhados, comparação e metas.
- **Foco geográfico inicial:** Brasil (servidor BR1), interface em português.

### 1.4 Definições e siglas

| Termo | Significado |
| --- | --- |
| Riot ID | Identificador do jogador no formato Nome#TAG |
| PUUID | Identificador único e permanente do jogador na API da Riot |
| Patch | Versão de atualização do jogo (ex.: 26.20) |
| Elo | Nível de ranqueada (Ferro a Desafiante) |
| Win rate / Pick rate / Ban rate | Taxas de vitória, escolha e banimento |
| KDA | (Abates + Assistências) / Mortes |
| CS | Minions e monstros abatidos |
| Timeline | Dados minuto a minuto de uma partida |
| Benchmark | Valor de referência (média por campeão, função e elo) |
| LLM | Modelo de linguagem usado para gerar textos de análise |
| MoSCoW | Priorização: Deve (D), Deveria (DV), Poderia (P) |

---

## 2. Visão geral do produto

### 2.1 Problema

Os sites atuais mostram muitos números, mas pouco explicam **por que** o jogador perdeu ou ganhou e **o que fazer** para melhorar. Jogadores casuais ficam perdidos nas tabelas, e os competitivos não encontram acompanhamento de evolução.

### 2.2 Proposta de valor

1. Dados completos de campeões e de jogadores num só lugar.
2. Análise de cada partida comparada com a média do elo.
3. Diagnóstico dos **padrões** do jogador em várias partidas.
4. Plano de treino com metas e acompanhamento.
5. Interface em português, pensada para o jogador brasileiro.

### 2.3 Personas

| Persona | Perfil | Necessidade principal |
| --- | --- | --- |
| Casual | Joga por diversão, elo Ferro a Ouro | Entender erros de forma simples, sem termos técnicos |
| Competitivo | Busca subir de elo, Prata a Diamante+ | Dados detalhados, metas e comparação com jogadores melhores |
| Duo/Amigos | Joga em grupo | Comparar evolução e competir entre si |

### 2.4 Premissas e dependências

- A API oficial da Riot Games estará disponível e com chave de produção aprovada.
- Os dados de campeões, itens e imagens virão do Data Dragon (Riot).
- Um modelo de linguagem (LLM) via API será usado para gerar os textos de análise.

### 2.5 Restrições

- A API da Riot impõe **limites de requisições**; a chave de desenvolvimento é temporária, limitada e expira a cada 24 horas.
- O uso dos dados deve seguir as políticas da Riot Games (aprovação do produto e aviso de que o site não é endossado pela Riot).
- O orçamento inicial é pequeno, por isso a arquitetura deve começar enxuta.

---

## 3. Requisitos funcionais

Legenda de prioridade: **D** = Deve, **DV** = Deveria, **P** = Poderia. A coluna **Fase** indica o momento previsto de entrega (ver seção 10).

### 3.1 Módulo Tier List (TL)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-TL-01 | Exibir campeões classificados em tiers (S+, S, A, B, C, D) por função | D | 1 |
| RF-TL-02 | Calcular a pontuação do tier com base em win rate, pick rate, ban rate, KDA e volume de partidas | D | 1 |
| RF-TL-03 | Filtrar por função (Topo, Selva, Meio, ADC, Suporte) | D | 1 |
| RF-TL-04 | Filtrar por patch, região e faixa de elo | D | 1 |
| RF-TL-05 | Mostrar variação em relação ao patch anterior | DV | 1 |
| RF-TL-06 | Alternar entre visualização em lista e em tabela ordenável | DV | 1 |
| RF-TL-07 | Exibir, para cada campeão, os principais contadores e as melhores duplas | DV | 2 |
| RF-TL-08 | Mostrar, no cabeçalho, o patch atual e o total de partidas processadas | DV | 1 |

### 3.2 Módulo Campeões, builds e contadores (CP)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-CP-01 | Página de cada campeão com estatísticas por função | D | 2 |
| RF-CP-02 | Build mais vencedora (itens, ordem de compra e botas) | DV | 2 |
| RF-CP-03 | Runas e feitiços mais usados | DV | 2 |
| RF-CP-04 | Ordem de habilidades recomendada | DV | 2 |
| RF-CP-05 | Seletor de contadores (escolher o inimigo e ver os melhores picks) | DV | 3 |
| RF-CP-06 | Página de duplas de bot lane e de selva | P | 3 |
| RF-CP-07 | Banco de dados de itens e de skins | P | 4 |

### 3.3 Módulo Busca e Perfil (PF)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-PF-01 | Buscar jogador por Riot ID (Nome#TAG) com seleção de região | D | 2 |
| RF-PF-02 | Exibir perfil com ícone, nível, elo, LP e vitórias/derrotas | D | 2 |
| RF-PF-03 | Exibir estatísticas por campeão (jogos, win rate, KDA) | D | 2 |
| RF-PF-04 | Exibir estatísticas por função e por período | DV | 2 |
| RF-PF-05 | Mostrar maestria dos campeões | DV | 2 |
| RF-PF-06 | Atualizar o perfil sob demanda, respeitando um intervalo mínimo entre atualizações | D | 2 |
| RF-PF-07 | Multi-busca (colar vários Riot IDs de uma vez) | P | 4 |
| RF-PF-08 | Histórico de elo ao longo das temporadas | P | 4 |
| RF-PF-09 | Salvar jogadores favoritos | P | 4 |

### 3.4 Módulo Histórico e detalhe da partida (PT)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-PT-01 | Listar partidas recentes com resultado, campeão, KDA, CS e duração | D | 2 |
| RF-PT-02 | Filtrar histórico por fila, campeão e função | DV | 2 |
| RF-PT-03 | Tela de detalhe com os 10 jogadores, itens, dano, ouro, visão e objetivos | D | 2 |
| RF-PT-04 | Gráfico de diferença de ouro e experiência ao longo do tempo | DV | 3 |
| RF-PT-05 | Carregamento progressivo (paginação ou rolagem infinita) | DV | 2 |

### 3.5 Módulo Análise pós-jogo com IA (AN)

Este é o **principal diferencial** do produto.

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-AN-01 | Calcular métricas da partida a partir da timeline (CS, ouro e experiência aos 10 e 15 min, mortes por minuto, participação em objetivos, visão) | D | 3 |
| RF-AN-02 | Comparar cada métrica com o benchmark do mesmo campeão, função e faixa de elo | D | 3 |
| RF-AN-03 | Identificar automaticamente pontos fortes e pontos fracos da partida | D | 3 |
| RF-AN-04 | Gerar resumo em texto, em português, explicando os erros e acertos com um LLM | D | 3 |
| RF-AN-05 | Linha do tempo comentada, com marcações dos momentos-chave (virada, mortes evitáveis, objetivos perdidos) | DV | 3 |
| RF-AN-06 | Analisar mortes: contexto, posição, presença de visão e proximidade de objetivos | DV | 3 |
| RF-AN-07 | Comparar a build usada com a build mais vitoriosa do campeão | DV | 3 |
| RF-AN-08 | Comparar o desempenho com a média de um elo acima ou com um jogador de referência | DV | 4 |
| RF-AN-09 | Dar uma nota geral e notas por categoria (início de jogo, combate, visão, objetivos, farm) | DV | 3 |
| RF-AN-10 | Explicar o porquê de cada apontamento, com linguagem adaptada ao nível do jogador (modo simples e modo avançado) | DV | 4 |
| RF-AN-11 | Permitir que o usuário avalie se a análise foi útil (feedback) | DV | 3 |

### 3.6 Módulo Padrões e plano de treino (TR)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-TR-01 | Diagnóstico de padrões em várias partidas (ex.: mortes entre 8 e 12 min, queda de CS nas derrotas) | D | 4 |
| RF-TR-02 | Gerar plano de treino com 1 a 3 metas semanais personalizadas | D | 4 |
| RF-TR-03 | Acompanhar o progresso das metas ao longo do tempo com gráficos de evolução | D | 4 |
| RF-TR-04 | Detecção de tilt: alertar quando o histórico mostra queda de desempenho em sequência de derrotas | DV | 5 |
| RF-TR-05 | Recomendar campeões com base no estilo e no desempenho do jogador | DV | 5 |
| RF-TR-06 | Resumo semanal por e-mail ou notificação | P | 5 |

### 3.7 Módulo Partida ao vivo (LV)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-LV-01 | Detectar se o jogador está em partida e exibir os 10 participantes | D | 4 |
| RF-LV-02 | Mostrar para cada jogador: campeão, elo, win rate recente e desempenho no campeão escolhido | D | 4 |
| RF-LV-03 | Mostrar runas e feitiços de invocador dos participantes | DV | 4 |
| RF-LV-04 | Alertas sobre jogadores (sequência de vitórias ou derrotas, fora da função, possível smurf) | DV | 4 |
| RF-LV-05 | Análise das composições dos times (dano físico/mágico, controle, front line) | DV | 4 |
| RF-LV-06 | Dicas de confronto (ex.: como jogar contra o campeão adversário no início da partida) | DV | 5 |

### 3.8 Módulo Draft (DR)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-DR-01 | Sugerir picks com base nas escolhas já feitas por ambos os times | DV | 5 |
| RF-DR-02 | Sugerir bans com base na função, no elo e no meta atual | P | 5 |
| RF-DR-03 | Mostrar pontos fortes e fracos da composição montada | P | 5 |

### 3.9 Módulo Coach virtual por chat (CH)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-CH-01 | Chat em que o jogador faz perguntas sobre o próprio desempenho (ex.: por que perco o início de jogo com certo campeão) | DV | 5 |
| RF-CH-02 | O assistente responde com base nas partidas e métricas reais do jogador | DV | 5 |
| RF-CH-03 | Limitar o uso por plano para controlar custos do LLM | D | 5 |
| RF-CH-04 | Impedir respostas fora do escopo do jogo | DV | 5 |

### 3.10 Módulo Comunidade (CM)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-CM-01 | Perfil público de evolução, compartilhável por link | P | 5 |
| RF-CM-02 | Desafios entre amigos e duplas, com ranking de quem mais melhorou | P | 5 |
| RF-CM-03 | Conquistas e medalhas por metas atingidas | P | 5 |

### 3.11 Módulo Contas e administração (UA)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-UA-01 | Cadastro e login (e-mail e login social) | D | 4 |
| RF-UA-02 | Vincular uma conta do site ao Riot ID, com verificação de propriedade | DV | 4 |
| RF-UA-03 | Excluir a conta e os dados do usuário a pedido (LGPD) | D | 4 |
| RF-UA-04 | Painel administrativo com status da coleta de dados, fila de requisições e erros | DV | 2 |
| RF-UA-05 | Gerenciar planos e limites de uso | P | 5 |

---

## 4. Requisitos não funcionais

| ID | Categoria | Requisito |
| --- | --- | --- |
| RNF-01 | Desempenho | Páginas principais (tier list, perfil já em cache) devem carregar em até 2 segundos em conexão comum |
| RNF-02 | Desempenho | Análise pós-jogo deve ficar pronta em até 30 segundos, com indicador de progresso |
| RNF-03 | Escalabilidade | A coleta e o processamento devem rodar em workers e fila, sem travar o site |
| RNF-04 | Disponibilidade | Meta de 99% de disponibilidade mensal |
| RNF-05 | Limites da API | O sistema deve controlar a taxa de requisições à Riot e tratar erros de limite (retry com espera) |
| RNF-06 | Cache | Perfis, histórico e tier list devem ser armazenados em cache com tempo de expiração adequado |
| RNF-07 | Usabilidade | Interface responsiva (celular, tablet e computador), em português, com tema claro e escuro |
| RNF-08 | Acessibilidade | Seguir boas práticas de contraste, navegação por teclado e textos alternativos |
| RNF-09 | Segurança | HTTPS obrigatório, senhas com hash, proteção contra ataques comuns (injeção, XSS, CSRF) |
| RNF-10 | Segurança | A chave da Riot e a chave do LLM nunca devem ser expostas no navegador |
| RNF-11 | Privacidade | Cumprir a LGPD: coletar apenas o necessário, informar o uso dos dados e permitir exclusão |
| RNF-12 | Manutenibilidade | Código organizado em módulos, com documentação e testes automatizados |
| RNF-13 | Observabilidade | Logs, monitoramento de erros e métricas de uso |
| RNF-14 | Atualização | Dados de novo patch e novos campeões devem ser incorporados em até 24 horas após o lançamento |
| RNF-15 | Custo | Monitorar o custo mensal com LLM e infraestrutura, com alertas de limite |

---

## 5. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | O tier de um campeão é definido por uma pontuação calculada com win rate, pick rate, ban rate, KDA e volume de partidas; campeões com poucas partidas não entram no ranking |
| RN-02 | Os benchmarks são calculados por campeão, função, patch e faixa de elo |
| RN-03 | Uma análise só compara o jogador com benchmark que tenha amostra mínima de partidas |
| RN-04 | O perfil de um jogador só pode ser atualizado de novo após um intervalo mínimo definido |
| RN-05 | O plano de treino sugere no máximo 3 metas ativas por vez, para não sobrecarregar o jogador |
| RN-06 | Os textos de análise não devem ofender ou culpar o jogador; o tom deve ser construtivo |
| RN-07 | Dados de partidas de patches antigos permanecem consultáveis, mas o padrão exibido é o patch atual |
| RN-08 | O site deve exibir o aviso de que não é endossado pela Riot Games |
| RN-09 | Os limites de uso do chat e das análises variam conforme o plano do usuário |

---

## 6. Integrações externas

| Serviço | Uso |
| --- | --- |
| API da Riot: account | Converter Riot ID em PUUID |
| API da Riot: league | Elo, LP e lista de jogadores por faixa de elo |
| API da Riot: match | Histórico, detalhes e timeline das partidas |
| API da Riot: spectator | Partida ao vivo |
| API da Riot: champion-mastery | Maestria dos campeões |
| Data Dragon / Community Dragon | Campeões, itens, runas, ícones e imagens |
| LLM via API | Geração dos textos de análise e do coach por chat |
| Serviço de e-mail | Confirmação de conta e resumos semanais |

> **Observação:** os nomes dos endpoints, versões, limites e regras de uso devem ser confirmados na documentação oficial da Riot antes do desenvolvimento, pois podem mudar.

---

## 7. Arquitetura proposta (visão geral)

A primeira versão será um **monólito modular com um processo worker separado**, no mesmo repositório. Não haverá microserviços: módulos organizados por domínio e limites claros entre interface, regras de negócio e integrações permitem começar simples sem impedir evolução.

### 7.1 Componentes

1. **Aplicação web (Next.js):** interface responsiva e API HTTP. Valida entradas, aplica autorização quando houver conta e chama casos de uso do servidor. Não acessa a Riot diretamente.
2. **Worker (Node.js/TypeScript):** processo de longa duração que consome a fila pg-boss. É o único componente da aplicação que consulta a API da Riot em produção; controla taxa, novas tentativas e sincronização.
3. **PostgreSQL:** fonte persistente dos dados do produto. Prisma define o esquema e as migrações; pg-boss usa o mesmo banco para tarefas duráveis. Redis não faz parte da arquitetura inicial.
4. **Módulos de domínio e aplicação:** regras de campeões, partidas, benchmarks, tier list e análise. Os cálculos são determinísticos e independentes do LLM.
5. **Integrações externas:** API da Riot e Data Dragon para dados do jogo; provedor de LLM apenas para transformar métricas calculadas em explicações. Nenhuma chave ou integração privilegiada chega ao navegador.
6. **Machine learning (fase 5):** componente futuro, fora do caminho crítico das requisições. Só será adicionado quando houver dados e uma necessidade comprovada; não terá acesso direto ao banco de produção sem uma decisão explícita de segurança e arquitetura.

### 7.2 Fluxos principais

- **Busca e atualização de perfil:** o navegador envia Riot ID e região à API; a API valida, aplica limites de solicitação e o intervalo mínimo por jogador, e então enfileira uma atualização. O worker consulta a Riot, salva os dados e atualiza o estado da tarefa. A interface exibe dados em cache quando disponíveis e informa quando uma atualização está pendente.
- **Tier list:** o worker coleta e agrega dados em segundo plano; a API consulta estatísticas já persistidas e entrega filtros e resultados. A requisição da página não dispara uma varredura da Riot.
- **Análise pós-jogo:** a API solicita ou enfileira a análise e responde com o estado atual. O worker calcula métricas e benchmark, valida os dados enviados ao LLM e salva o resultado. A interface acompanha o estado e apresenta as métricas mesmo se o provedor de LLM estiver indisponível.
- **Fila e falhas:** tarefas devem ser idempotentes, ter tentativas limitadas com espera progressiva e registrar falhas observáveis. A chave de idempotência e as restrições únicas no banco evitam duplicar partidas e análises.

### 7.3 Limites e implantação

- A aplicação web e o worker são processos implantáveis separadamente, mas compartilham o mesmo repositório, tipos e módulos de negócio.
- O worker é a única origem das chamadas à Riot em produção. Inicialmente, manter uma instância lógica do worker por chave/região para que o controle de taxa seja centralizado; escalar instâncias exige rate limiter distribuído.
- O navegador nunca acessa PostgreSQL, fila, Riot ou LLM diretamente.
- Hospedagem proposta: Vercel para a aplicação web, Neon ou Supabase para PostgreSQL e Railway ou Render para o worker. A decisão final de provedores fica para T-018.

---

## 8. Modelo de dados preliminar

| Entidade | Principais campos |
| --- | --- |
| Jogador | puuid, riot\_id, região, nível, ícone, última atualização |
| Elo | puuid, fila, tier, divisão, LP, vitórias, derrotas, data |
| Partida | id, patch, fila, duração, data, vencedor |
| ParticipantePartida | partida, puuid, campeão, função, KDA, CS, ouro, dano, visão, itens, runas, resultado |
| EventoTimeline | partida, minuto, tipo (morte, objetivo, compra), posição, participantes |
| EstatisticaCampeao | campeão, função, patch, elo, win rate, pick rate, ban rate, KDA, amostra |
| Benchmark | campeão, função, patch, elo, métrica, média, desvio, amostra |
| Analise | partida, puuid, métricas, pontos fortes/fracos, texto, nota, data |
| Meta | usuário, tipo, valor alvo, progresso, status, datas |
| Usuário | id, e-mail, plano, riot\_id vinculado, preferências |

---

## 9. Inteligência artificial e análise

### 9.1 Abordagem em camadas

A IA **não precisa ser treinada do zero por tentativa e erro**. A proposta é construir em camadas, da mais simples para a mais avançada:

1. **Estatística e benchmarks (fase 3):** médias por campeão, função e elo, com comparação direta.
2. **LLM como treinador (fase 3):** recebe os números e os pontos fracos já calculados e escreve a explicação em português natural, sem treinamento próprio.
3. **Padrões em várias partidas (fase 4):** regras e estatística para detectar comportamentos repetidos.
4. **Machine learning supervisionado (fase 5):** modelos treinados com os dados da própria plataforma para estimar quais fatores mais influenciam a vitória e priorizar os conselhos. Esta é a parte que **melhora com o tempo**, conforme a base de partidas cresce.

### 9.2 Métricas candidatas para análise

- CS por minuto e CS aos 10 e 15 minutos
- Diferença de ouro e experiência para o oponente de função
- Mortes por minuto e mortes antes de objetivos
- Pontuação de visão e wards colocadas e destruídas
- Participação em abates e objetivos
- Dano por minuto e dano em relação ao ouro
- Eficiência da build

### 9.3 Cuidados

- Medir a qualidade das análises com o feedback dos usuários (RF-AN-11).
- Evitar conclusões com amostra pequena de partidas.
- Revisar periodicamente os textos gerados para checar erros e tom.
- Controlar o custo do LLM com limites e cache de análises já geradas.

---

## 10. Roadmap por fases

| Fase | Entregas | Resultado esperado |
| --- | --- | --- |
| 1 | Tier list, filtros, coleta inicial de dados | Base de dados funcionando e tier list publicada |
| 2 | Busca, perfil, histórico, detalhe de partida, páginas de campeões | Site útil para consultar jogadores |
| 3 | Análise pós-jogo com benchmarks e texto de IA, gráfico de ouro | Diferencial central do produto |
| 4 | Padrões, plano de treino, contas, partida ao vivo | Acompanhamento de evolução e uso durante o jogo |
| 5 | Draft, tilt, coach por chat, machine learning, comunidade | Produto completo e diferenciado |

Cada fase deve terminar com uma versão publicada e testada, para coletar feedback antes de seguir.

---

## 11. Riscos

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Chave de produção da Riot negada ou atrasada | Alto | Preparar o pedido cedo, com descrição clara do projeto; começar com a chave de desenvolvimento em escala pequena |
| Limites da API limitam o volume de dados | Alto | Fila com controle de taxa, cache e foco em um elo e uma região no início |
| Custo elevado com LLM | Médio | Cache, limites por plano, textos curtos e modelos mais econômicos |
| Análises genéricas ou incorretas | Alto | Basear o texto em métricas calculadas, testar com jogadores reais e coletar feedback |
| Mudança de política ou de endpoints da Riot | Médio | Camada de abstração para a API e acompanhamento da documentação |
| Concorrência com sites já consolidados | Médio | Focar no diferencial de ensino, no público brasileiro e no acompanhamento de evolução |
| Escopo grande demais | Alto | Entregar por fases e priorizar com MoSCoW |
| Violação de privacidade (LGPD) | Alto | Política de privacidade, consentimento e exclusão de dados |

---

## 12. Aspectos legais e de conformidade

- Seguir os termos de uso e as políticas de desenvolvedor da Riot Games, incluindo o processo de registro do produto.
- Exibir o aviso de que o site não é endossado pela Riot Games e não reflete a opinião da empresa.
- Não copiar código, design, textos ou marca de outros sites; usar apenas as ideias.
- Cumprir a LGPD (política de privacidade, termos de uso, consentimento e exclusão de dados).
- Evitar o uso indevido de nomes e imagens que possam gerar confusão com a marca da Riot.

---

## 13. Critérios de aceite por módulo

| Módulo | Critério de aceite |
| --- | --- |
| Tier List | Exibe todos os campeões do patch atual em tiers corretos, com filtros funcionando e valores coerentes com os dados do banco |
| Busca e perfil | Ao digitar um Riot ID válido, o perfil carrega com elo e estatísticas; ID inexistente mostra mensagem clara |
| Histórico e detalhe | Lista as últimas partidas e abre o detalhe com os 10 jogadores sem erros |
| Análise com IA | Para uma partida válida, gera notas, pontos fortes e fracos e um texto coerente com as métricas, em até 30 segundos |
| Plano de treino | Gera metas a partir de padrões reais e mostra a evolução em gráfico após novas partidas |
| Partida ao vivo | Detecta a partida em andamento e lista os 10 jogadores com seus dados |
| Contas | Cadastro, login e exclusão de dados funcionam de ponta a ponta |

---

## 14. Plano de testes

### 14.1 Estratégia

Os testes acompanham cada fase. Quanto mais cedo um erro for achado, mais barato corrigi-lo.

| Tipo de teste | Objetivo | Exemplos |
| --- | --- | --- |
| Unitário | Validar funções isoladas | Cálculo de win rate, de pontuação de tier e de CS aos 10 minutos |
| Integração | Validar a comunicação entre partes | Backend com a API da Riot, backend com banco, backend com LLM |
| Funcional (sistema) | Validar os requisitos | Fluxos de busca, perfil, análise e plano de treino |
| Dados | Validar a qualidade das estatísticas | Comparar números calculados com uma amostra conferida manualmente |
| Desempenho e carga | Verificar tempos e limites | Muitas buscas simultâneas, fila de requisições, tempo de análise |
| Segurança | Encontrar vulnerabilidades | Injeção, XSS, exposição de chaves, controle de acesso |
| Usabilidade | Verificar facilidade de uso | Teste com jogadores casuais e competitivos |
| Responsividade | Verificar telas | Celular, tablet, computador e navegadores principais |
| Qualidade da IA | Avaliar os textos de análise | Revisão manual de uma amostra, nota de utilidade dos usuários |
| Regressão | Garantir que novidades não quebrem o que já funciona | Execução automática a cada alteração |
| Aceite (UAT) | Validar com usuários reais | Grupo beta de jogadores antes de cada lançamento |

### 14.2 Casos de teste de exemplo

| ID | Cenário | Passos | Resultado esperado |
| --- | --- | --- | --- |
| CT-01 | Busca de jogador válido | Digitar um Riot ID existente na região BR | Riot ID validado, perfil e filas ranqueadas salvos; a tela completa do perfil pertence à T-035 |
| CT-02 | Busca de jogador inexistente | Digitar um Riot ID que não existe | Mensagem clara de jogador não encontrado |
| CT-03 | Riot ID com formato inválido | Digitar nome sem a TAG | Mensagem pedindo o formato Nome#TAG |
| CT-04 | Filtro da tier list | Selecionar função Meio e elo Diamante+ | Lista atualizada somente com campeões da função e do elo |
| CT-05 | Limite da API | Simular muitas buscas em pouco tempo | Fila organiza as requisições, sem erro para o usuário e sem bloqueio da chave |
| CT-06 | Análise de partida | Abrir a análise de uma partida recente | Notas, pontos fortes e fracos e texto exibidos em até 30 segundos |
| CT-07 | Partida curta (remake) | Abrir a análise de uma partida anulada | Sistema informa que a partida não pode ser analisada |
| CT-08 | Poucas partidas | Gerar o diagnóstico de um jogador com poucas partidas | Aviso de amostra insuficiente, sem conclusões forçadas |
| CT-09 | Falha do LLM | Simular indisponibilidade do serviço de IA | Métricas e gráficos aparecem; texto fica pendente com opção de tentar novamente |
| CT-10 | Atualização do perfil | Pedir atualização duas vezes seguidas | Segunda tentativa recusada com aviso do tempo de espera |
| CT-11 | Exclusão de conta | Solicitar a exclusão dos dados | Dados pessoais removidos e confirmação enviada |
| CT-12 | Partida ao vivo | Buscar um jogador que está em partida | Os 10 participantes são exibidos com seus dados |
| CT-13 | Jogador fora de partida | Buscar um jogador que não está jogando | Mensagem informando que não há partida em andamento |
| CT-14 | Celular | Abrir a tier list em tela pequena | Layout adaptado, sem rolagem horizontal da página |

### 14.3 Critérios de saída de cada fase

- Todos os requisitos de prioridade **Deve** da fase atendidos.
- Nenhum defeito crítico ou de alta gravidade aberto.
- Casos de teste da fase executados e aprovados.
- Metas de desempenho (RNF-01 e RNF-02) atingidas.

---

## 15. Métricas de sucesso

| Métrica | Meta inicial (sugestão) |
| --- | --- |
| Usuários ativos mensais | Definir meta após o lançamento da fase 2 |
| Tempo médio de análise | Menor que 30 segundos |
| Avaliação de utilidade das análises | Maior que 70% de respostas positivas |
| Retenção (voltam em 30 dias) | Definir meta após a fase 4 |
| Metas de treino concluídas | Acompanhar a taxa por usuário |
| Custo por análise (LLM) | Dentro do orçamento definido |
| Disponibilidade | 99% ao mês |

---

## 16. Pontos em aberto (a definir)

1. **Nome do projeto e identidade visual.**
2. **Modelo de negócio:** gratuito com anúncios, plano premium, ou os dois? Quais recursos ficam no plano pago (sugestão: chat de coach e análises ilimitadas)?
3. **Orçamento mensal** de infraestrutura e de LLM.
4. **Equipe:** quem desenvolve, quem cuida dos dados e quem faz o design?
5. **Escolha da stack** (decidida: TypeScript no site e na API, Python apenas para machine learning; ver seção 21).
6. **Regiões atendidas** além do BR.
7. **Modos de jogo** incluídos (apenas ranqueada, ou também ARAM e outros).
8. **Prazos** de cada fase.
9. **Política de moderação** para os recursos de comunidade.
10. **Idiomas** além do português.

---

## 17. Histórico de revisões

| Versão | Data | Descrição |
| --- | --- | --- |
| 0.1 | 14/10/2026 | Primeira versão, com o levantamento inicial de requisitos |

---

## 18. Requisitos adicionais: comunidade brasileira (revisão 0.2)

Esta seção amplia o produto para além das estatísticas. A meta é ser **o melhor site de LoL para o jogador brasileiro**, apoiado em quatro pilares:

1. **Ensinar:** cada tela deve ajudar o jogador a entender o que fazer melhor.
2. **Comunidade:** o jogador evolui junto com outros jogadores, não sozinho.
3. **Brasileiro:** idioma, horário, pagamento, cultura e cenário daqui.
4. **Confiável e seguro:** moderação forte e dados tratados com respeito.

As fases 6 e 7 foram acrescentadas ao roadmap (ver seção 18.7). Os requisitos seguem a mesma legenda da seção 3: **D** = Deve, **DV** = Deveria, **P** = Poderia.

### 18.1 Identidade brasileira (BR)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-BR-01 | Toda a interface, os textos de IA e o glossário em português do Brasil, com as gírias do jogo explicadas por tooltip | D | 2 |
| RF-BR-02 | Horário de Brasília e formatos brasileiros (datas e valores em reais) em todo o site | D | 2 |
| RF-BR-03 | Versão leve para celulares de entrada e conexões limitadas (imagens otimizadas, carregamento sob demanda) | D | 2 |
| RF-BR-04 | Ranking Brasil: melhores jogadores do servidor BR por campeão e por função | DV | 6 |
| RF-BR-05 | Resumo de cada patch em português, com o impacto no meta e os campeões mais afetados | DV | 6 |
| RF-BR-06 | Pagamento por Pix, cartão e boleto nos planos pagos | DV | 7 |
| RF-BR-07 | Página de streamers e jogadores profissionais brasileiros, com partidas e builds (somente com autorização deles) | P | 7 |
| RF-BR-08 | Cenário competitivo brasileiro (calendário e resultados), sujeito à viabilidade da fonte de dados e às regras da Riot | P | 7 |

### 18.2 Aprendizado (AP)

É o módulo que mais reforça o diferencial de ensinar, principalmente para o jogador casual.

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-AP-01 | Trilhas de aprendizado por função e nível (farm, controle de wave, visão, objetivos, trocas, movimentação no mapa) com lições curtas | DV | 4 |
| RF-AP-02 | Quizzes de decisão: uma situação de jogo, escolha da melhor ação e explicação do porquê | DV | 4 |
| RF-AP-03 | Glossário e wiki em português (termos, conceitos de macro e de micro) | DV | 4 |
| RF-AP-04 | Modo iniciante (3 pontos principais da análise) e modo avançado (análise completa) | DV | 4 |
| RF-AP-05 | Recomendar automaticamente a lição ou o guia certo com base nos pontos fracos detectados na análise | DV | 5 |
| RF-AP-06 | Lições ilustradas com momentos reais das partidas do próprio jogador | P | 6 |
| RF-AP-07 | Desafios semanais de aprendizado (ex.: semana do farm, semana da visão), com ranking de evolução | P | 6 |

### 18.3 Social e comunidade (SC)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-SC-01 | Perfil social: bio, campeões e funções favoritas, horários, objetivos e estilo (casual ou competitivo) | DV | 6 |
| RF-SC-02 | Verificação de Riot ID obrigatória para participar de recursos sociais | D | 6 |
| RF-SC-03 | Procurar duo ou time (LFG), com filtros por elo, função, horário e estilo de jogo | DV | 6 |
| RF-SC-04 | Fórum e perguntas e respostas por campeão, função e patch | DV | 6 |
| RF-SC-05 | Revisão pela comunidade: o jogador publica uma partida e pede opiniões; outros comentam momentos específicos da linha do tempo | DV | 6 |
| RF-SC-06 | Desafios entre amigos e duplas, com ranking de quem mais evoluiu (comparando dentro da mesma faixa de elo, para ser justo) | DV | 6 |
| RF-SC-07 | Conquistas, XP do site, níveis e sequências (streaks) de metas cumpridas | DV | 6 |
| RF-SC-08 | Guias escritos por usuários, com votação e selo de criador verificado | P | 7 |
| RF-SC-09 | Mentoria: jogadores de elo alto cadastrados como mentores de iniciantes | P | 7 |
| RF-SC-10 | Times e clãs, com página própria, ranking interno e metas coletivas | P | 7 |
| RF-SC-11 | Reputação de jogadores (avaliações após jogar junto, com proteção contra abuso) | P | 7 |
| RF-SC-12 | Eventos e torneios amistosos (partidas personalizadas), com inscrição e chaveamento | P | 7 |
| RF-SC-13 | Marketplace de coaches brasileiros verificados, com agenda, avaliações e pagamento | P | 7 |

### 18.4 Integrações sociais (IS)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-IS-01 | Compartilhar uma análise por link público e por card em imagem (Discord, WhatsApp, Instagram e X) | DV | 4 |
| RF-IS-02 | Bot oficial de Discord (comandos de perfil, última partida, análise e tier list) | DV | 5 |
| RF-IS-03 | Notificações por e-mail, push e Discord (metas, resumo semanal, respostas no fórum) | DV | 5 |
| RF-IS-04 | Site instalável no celular (PWA) | DV | 5 |
| RF-IS-05 | Servidor de Discord da comunidade, integrado às contas verificadas (cargos por elo) | P | 6 |
| RF-IS-06 | Widget para streamers (overlay com elo e win rate, para usar na transmissão) | P | 7 |

### 18.5 Moderação e segurança da comunidade (MD)

| ID | Requisito | Prior. | Fase |
| --- | --- | --- | --- |
| RF-MD-01 | Regras da comunidade e termos de uso específicos para os recursos sociais | D | 6 |
| RF-MD-02 | Denúncia de conteúdo e de usuários, com fila de moderação | D | 6 |
| RF-MD-03 | Filtro automático de ofensas e spam (lista de termos em português, incluindo gírias, mais IA) | D | 6 |
| RF-MD-04 | Bloquear e silenciar usuários | D | 6 |
| RF-MD-05 | Painel para moderadores, com histórico de ações e penalidades graduais | D | 6 |
| RF-MD-06 | Proteção de menores de idade conforme a legislação brasileira (idade mínima e consentimento dos responsáveis quando aplicável); consultar um advogado antes do lançamento das contas | D | 4 |
| RF-MD-07 | Regra de não exposição: o site não rotula nem humilha jogadores (sem rankings de piores jogadores e sem selos como tóxico) | D | 4 |

### 18.6 Regras de negócio adicionais

| ID | Regra |
| --- | --- |
| RN-10 | O plano gratuito deve incluir o essencial: tier list, busca, perfil e um número limitado de análises por dia (limite a definir) |
| RN-11 | O plano premium pode incluir análises ilimitadas, chat do coach, histórico mais longo e ausência de anúncios |
| RN-12 | Anúncios devem ser discretos e nunca aparecer no meio da análise nem em páginas de moderação |
| RN-13 | O marketplace de coaches cobra uma comissão por sessão, e todo coach passa por verificação |
| RN-14 | Rankings de evolução comparam jogadores da mesma faixa de elo |
| RN-15 | Todo conteúdo da comunidade pode ser denunciado, e a moderação deve responder dentro de um prazo definido |
| RN-16 | Parcerias com streamers e organizações devem ser identificadas de forma transparente no site |

### 18.7 Roadmap atualizado

| Fase | Entregas | Resultado esperado |
| --- | --- | --- |
| 1 a 5 | Conforme a seção 10 | Produto central de dados, análise e ensino |
| 6 | Comunidade: perfil social, LFG, fórum, revisão pela comunidade, desafios, conquistas, ranking Brasil, moderação | Jogadores se conectam e evoluem juntos |
| 7 | Expansão: coaches, torneios, planos pagos com Pix, criadores, streamers, cenário competitivo, widgets | Sustentabilidade financeira e crescimento |

> **Importante:** a fase 6 só deve começar depois que o sistema de moderação (RF-MD-01 a RF-MD-05) estiver pronto. Abrir a comunidade sem moderação é um dos maiores riscos do projeto.

---

## 19. Backlog de desenvolvimento ordenado

Esta seção transforma o documento em uma **lista de tarefas na ordem em que devem ser feitas**. A regra principal é simples: terminou uma tarefa, a próxima é a de número seguinte. As tarefas já estão ordenadas por prioridade e dependência, então você não precisa decidir toda vez.

### 19.1 Como usar

1. **Siga a numeração.** Faça uma tarefa por vez (no máximo duas em paralelo). Só pule uma tarefa se ela estiver bloqueada.
2. **Se estiver bloqueado**, use a trilha paralela (seção 19.2) para não ficar parado.
3. **Marque o status** de cada tarefa: ☐ a fazer, ◐ em andamento, ☑ pronta.
4. **Cada épico termina em um marco.** Só avance para o próximo épico depois de cumprir o critério do marco.
5. **Dentro de cada fase**, os requisitos de prioridade Deve vêm antes dos de prioridade Deveria e Poderia.
6. **Esforço (referência para um desenvolvedor solo):** P = até 1 dia, M = 2 a 5 dias, G = 1 a 3 semanas. Ajuste conforme a sua realidade.
7. **Se mudar uma prioridade**, registre o motivo na seção 17 (histórico de revisões).

### 19.2 Trilha paralela (enquanto espera a chave de produção da Riot)

A chave de produção pode demorar. Um produto público não pode rodar com a chave de desenvolvimento, então enquanto espera, avance nestas tarefas, que **não dependem da aprovação**: T-008 a T-013 (design), T-020 (landing e páginas legais), T-044, T-045, T-061, T-068 e T-088 (regras da comunidade).

### 19.3 Épico 0: Preparação (semana 0)

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-001 | Entrar no portal de desenvolvedores da Riot e gerar a chave de desenvolvimento | — | P | Chave visível no painel | ☑ |
| T-002 | Testar chamadas: Riot ID para PUUID, elo e últimas partidas, com um script simples | T-001 | P | Dados aparecem no terminal | ☑ |
| T-003 | Ler a documentação e as políticas da Riot (uso de dados, aviso obrigatório, limites) e anotar as regras | — | P | Resumo das regras salvo | ☑ |
| T-004 | Definir o nome do projeto, verificar domínio e redes sociais | — | M | Nome e domínio escolhidos | ◐ |
| T-005 | Criar o repositório Git, o quadro de tarefas (copiar este backlog) e padrões de código | — | P | Repositório e quadro criados | ☑ |
| T-006 | Decidir a stack (backend, banco e hospedagem) e registrar a decisão | T-003 | P | Stack documentada | ☑ |
| T-007 | Rascunhar a descrição do produto para o pedido da chave de produção (usar as seções 1, 2 e 12) | T-003, T-004 | P | Texto pronto para o formulário | ☑ |

### 19.4 Épico 1: Design orientado por descrição e protótipo em código

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-008 | Definir por descrição escrita o tom visual e as referências de marca, sem copiar interfaces de terceiros | T-004 | P | Direção visual registrada neste documento | ☑ |
| T-009 | Definir identidade visual: marca própria, paleta, cores semânticas e tipografia | T-008 | M | Paleta e regras visuais aprovadas pelo desenvolvedor | ☑ |
| T-010 | Implementar no código os tokens e componentes visuais reutilizáveis (cards, filtros, tiers, tabela, ícones e estados) | T-009 | M | Componentes responsivos e acessíveis implementados | ◐ |
| T-011 | Especificar por texto os fluxos de tier list, busca, perfil, partida e análise | T-008 | M | Comportamentos e estados de cada tela descritos | ◐ |
| T-012 | Implementar protótipo responsivo das telas das fases 1 e 2 diretamente no site | T-010, T-011 | G | Telas navegáveis em desktop e celular | ◐ |
| T-013 | Revisar o protótipo no navegador e testar com 5 jogadores (casuais e competitivos) | T-012 | M | Ajustes anotados e aplicados | ☐ |

### 19.5 Épico 2: Fundação técnica

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-014 | Configurar a fundação do backend, PostgreSQL, Prisma, pg-boss, worker Node.js e ambiente local (Docker) | T-006 | M | Banco, aplicação e worker iniciam localmente | ☑ |
| T-015 | Configurar o frontend (Next.js), layout base, tema visual escolhido e textos em português | T-006, T-010 | M | Aplicação e layout visual rodam localmente | ☑ |
| T-016 | Cliente da API da Riot no worker, com controle de taxa, novas tentativas e registro de erros | T-002, T-014 | M | Chamadas do worker respeitam os limites e registram falhas | ◐ |
| T-017 | Importar dados estáticos do Data Dragon (campeões, itens, runas, imagens) e atualizar a cada patch | T-014 | M | Dados do patch atual no banco | ◐ |
| T-018 | Ambiente de teste (staging) protegido por senha, publicação automática e testes automáticos (CI) | T-014, T-015 | M | Cada alteração publica no teste | ☐ |
| T-019 | Monitoramento de erros, logs e backup automático do banco | T-018 | P | Alertas e backups funcionando | ☐ |
| T-020 | Landing 'em breve' com política de privacidade, termos de uso e aviso de que o site não é endossado pela Riot | T-009, T-015 | M | Página publicada no domínio | ☐ |

### 19.6 Épico 3: Fase 1, tier list

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-021 | Modelar o banco: partidas, participantes, estatísticas e benchmarks | T-014 | M | Tabelas criadas | ☑ |
| T-022 | Coletor de jogadores por faixa de elo (servidor BR) | T-016, T-021 | M | Lista de jogadores salva | ☑ |
| T-023 | Coletor de IDs e detalhes das partidas, com fila e sem duplicatas | T-022 | G | Partidas entrando no banco | ☑ |
| T-024 | Guardar cada partida junto com o patch correspondente | T-023 | P | Campo de patch preenchido | ☑ |
| T-025 | Job de agregação: win rate, pick rate, ban rate, KDA e jogos por campeão, função, patch e elo | T-024 | G | Tabela de estatísticas gerada | ◐ |
| T-026 | Fórmula de pontuação e tiers (S+ a D), com testes unitários e conferência manual de uma amostra | T-025 | M | Tiers coerentes com os dados | ◐ |
| T-027 | API da tier list com filtros (função, patch, elo) e cache | T-026 | M | Endpoint respondendo rápido | ☑ |
| T-028 | Tela da tier list: lista, tabela ordenável, filtros e variação em relação ao patch anterior | T-012, T-027 | G | Tela igual ao design | ◐ |
| T-029 | Estados de carregamento, vazio e erro; ajuste para celular | T-028 | M | Sem rolagem horizontal no celular | ☑ |
| T-030 | Testes de aceite da fase 1 (CT-04 e conferência dos dados) | T-029 | M | Testes aprovados | ◐ |
| T-031 | **Registrar o produto na Riot e pedir a chave de produção** (com descrição, landing, protótipo e tier list no ambiente de teste) | T-007, T-020, T-030 | M | Pedido enviado | ☐ |

> **Marco 1: Fase 1 concluída (ambiente de teste).** Atenção: não abra a tier list ao público enquanto estiver usando a chave de desenvolvimento. Mantenha o ambiente protegido por senha até a chave de produção ser aprovada.

### 19.7 Épico 4: Fase 2, busca e perfil

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-032 | Busca por Riot ID: validação do formato, consulta do PUUID e mensagens de erro amigáveis | T-016 | M | CT-01, CT-02 e CT-03 passam | ☑ |
| T-033 | Tela inicial com a busca e o seletor de região | T-012, T-032 | M | Busca funcionando na tela | ☑ |
| T-034 | Coletar e guardar o perfil (nível, ícone, elo, LP, vitórias e derrotas) | T-032 | M | Dados do perfil no banco | ☑ |
| T-035 | **Tela do perfil**: cabeçalho com elo, LP e win rate | T-034 | M | Perfil abre com dados reais | ☐ |
| T-036 | **Histórico de partidas: coleta paginada** (próxima tarefa depois do perfil) | T-035 | M | Partidas do jogador no banco | ☐ |
| T-037 | Lista de partidas (campeão, resultado, KDA, CS, duração) com filtros | T-036 | M | Lista com paginação | ☐ |
| T-038 | Estatísticas do jogador por campeão e por função | T-036 | M | Tabelas no perfil | ☐ |
| T-039 | Maestria dos campeões | T-034 | P | Maestria exibida | ☐ |
| T-040 | Botão de atualizar o perfil com intervalo mínimo entre atualizações | T-035 | P | CT-10 passa | ☐ |
| T-041 | Detalhe da partida: 10 jogadores, itens, dano, ouro, visão e objetivos | T-037 | G | Tela de detalhe completa | ☐ |
| T-042 | Páginas de campeões: estatísticas por função, build, runas e ordem de habilidades, com SEO (títulos, URLs amigáveis e mapa do site) | T-025, T-017 | G | Páginas indexáveis | ☐ |
| T-043 | Contadores e duplas na tier list e nas páginas de campeões | T-042 | M | Contadores exibidos | ☐ |
| T-044 | Painel administrativo básico (status da coleta, fila e erros) | T-023 | M | Painel mostra a saúde do sistema | ☐ |
| T-045 | Tooltips e glossário em português nas telas existentes | T-041 | M | Termos explicados nas telas | ☐ |
| T-046 | Testes de aceite da fase 2, teste de carga leve e revisão de segurança | T-041 a T-045 | M | Sem defeitos críticos | ☐ |

> **Marco 2: Alpha fechado.** Com a chave de produção aprovada, o site pode abrir para um grupo pequeno de jogadores.

### 19.8 Épico 5: Fase 3, análise pós-jogo com IA

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-047 | Coletar e guardar a timeline das partidas | T-036 | M | Timeline salva por partida | ☐ |
| T-048 | Calcular métricas: CS, ouro e XP aos 10 e 15 minutos, mortes por minuto, visão e participação em objetivos | T-047 | G | Métricas conferidas em amostra | ☐ |
| T-049 | Gerar benchmarks por campeão, função, patch e elo, com amostra mínima | T-025, T-048 | G | Tabela de benchmarks pronta | ☐ |
| T-050 | Comparar a partida com os benchmarks e detectar pontos fortes e fracos por regras | T-049 | M | Lista de pontos por partida | ☐ |
| T-051 | Notas por categoria e nota geral | T-050 | M | Notas exibidas | ☐ |
| T-052 | Gráfico de diferença de ouro e XP ao longo do tempo | T-048 | M | Gráfico na tela da partida | ☐ |
| T-053 | Análise de mortes: momento, local, visão e proximidade de objetivos | T-048 | G | Mortes classificadas | ☐ |
| T-054 | Comparar a build usada com a mais vitoriosa do campeão | T-041, T-042 | M | Comparação exibida | ☐ |
| T-055 | Integração com o LLM: prompts em português, resposta estruturada, tom construtivo e proteções contra respostas erradas | T-050 | G | Texto coerente com as métricas | ☐ |
| T-056 | Cache das análises, limites de uso por usuário e alerta de custo | T-055 | M | Custo por análise monitorado | ☐ |
| T-057 | Tela da análise: resumo, notas, pontos fortes e fracos e linha do tempo comentada | T-012, T-051 a T-055 | G | CT-06 passa | ☐ |
| T-058 | Botão de feedback (a análise foi útil?) com registro | T-057 | P | Feedback salvo | ☐ |
| T-059 | Revisão manual de uma amostra de análises e ajuste de prompts e regras | T-057 | M | Qualidade aprovada | ☐ |
| T-060 | Beta fechado com jogadores casuais e competitivos | T-059 | G | Feedback coletado e ajustes prioritários feitos | ☐ |

> **Marco 3: análise com IA validada.** Este é o diferencial central do produto. Só siga adiante depois de a maioria dos testadores dizer que a análise ajuda.

### 19.9 Épico 6: Fase 4A, contas, padrões, treino e ensino

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-061 | Definir com um advogado a idade mínima, os termos e o consentimento (RF-MD-06) e registrar a regra de não exposição de jogadores (RF-MD-07) | T-020 | M | Política definida por escrito | ☐ |
| T-062 | Cadastro e login (e-mail e login social), com consentimento e exclusão de conta (LGPD) | T-061 | G | CT-11 passa | ☐ |
| T-063 | Vincular a conta ao Riot ID, com verificação de propriedade pelo método permitido pela Riot | T-062 | M | Vínculo verificado | ☐ |
| T-064 | Detector de padrões em várias partidas (mortes por faixa de tempo, queda de CS nas derrotas etc.) | T-060 | G | Padrões gerados para um jogador | ☐ |
| T-065 | Gerador do plano de treino (1 a 3 metas por vez) | T-064 | M | Plano gerado automaticamente | ☐ |
| T-066 | Painel de evolução e acompanhamento das metas | T-062, T-065 | G | Gráficos de progresso | ☐ |
| T-067 | Modo iniciante e modo avançado na análise | T-057 | M | Alternância funcionando | ☐ |
| T-068 | Glossário e wiki em português | T-045 | M | Páginas publicadas | ☐ |
| T-069 | Quizzes de decisão e primeiras trilhas de aprendizado | T-068 | G | Pelo menos uma trilha por função | ☐ |
| T-070 | Compartilhar análise por link público e card em imagem | T-057 | M | Card abre bem no Discord e no WhatsApp | ☐ |
| T-071 | Testes de aceite da fase 4A e lançamento da versão com contas | T-062 a T-070 | M | Sem defeitos críticos | ☐ |

> **Marco 4: contas e acompanhamento de evolução no ar.**

### 19.10 Épico 7: Fase 4B, partida ao vivo

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-072 | Detectar partida em andamento | T-016 | M | CT-12 e CT-13 passam | ☐ |
| T-073 | Tela ao vivo: 10 jogadores, elos, win rate recente e desempenho no campeão | T-072 | G | Tela completa | ☐ |
| T-074 | Runas e feitiços dos participantes | T-073 | M | Dados exibidos | ☐ |
| T-075 | Alertas sobre jogadores (sequências, fora da função, possível smurf), com tom neutro e sem rótulos ofensivos | T-073, T-061 | M | Alertas revisados | ☐ |
| T-076 | Análise das composições dos times | T-073 | M | Resumo de cada composição | ☐ |
| T-077 | Testes de aceite do módulo ao vivo | T-072 a T-076 | M | Testes aprovados | ☐ |

### 19.11 Épico 8: Fase 5, inteligência avançada e integrações

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-078 | Bot de Discord oficial | T-062 | G | Comandos básicos funcionando | ☐ |
| T-079 | Notificações por e-mail, push e Discord, e resumo semanal | T-066 | M | Resumo semanal enviado | ☐ |
| T-080 | Site instalável no celular (PWA) | T-029 | P | Instalação funcionando | ☐ |
| T-081 | Recomendação automática de lições conforme os pontos fracos | T-064, T-069 | M | Recomendação aparece na análise | ☐ |
| T-082 | Detecção de tilt | T-064 | M | Aviso exibido com base no histórico | ☐ |
| T-083 | Recomendação de campeões para o jogador | T-064 | M | Sugestões geradas | ☐ |
| T-084 | Dicas de confronto na tela ao vivo | T-076 | M | Dicas por campeão | ☐ |
| T-085 | Sugestões de pick e ban no draft | T-049 | G | Sugestões durante a seleção | ☐ |
| T-086 | Coach por chat, com limites por plano e escopo restrito ao jogo | T-056, T-062 | G | Respostas baseadas nas partidas do jogador | ☐ |
| T-087 | Modelos de machine learning para priorizar os conselhos (quando houver base de dados suficiente) | T-064 | G | Modelo avaliado contra as regras atuais | ☐ |

> **Marco 5: produto central completo.**

### 19.12 Épico 9: Fase 6, comunidade brasileira

A ordem abaixo é intencional: **moderação primeiro, recursos sociais depois.**

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-088 | Regras da comunidade, termos específicos e política de moderação | T-062 | M | Documentos publicados | ☐ |
| T-089 | Sistema de denúncia, bloqueio e fila de moderação | T-088 | G | Denúncia chega à fila | ☐ |
| T-090 | Filtro automático de ofensas e spam em português, com gírias | T-089 | M | Filtro testado com exemplos reais | ☐ |
| T-091 | Painel dos moderadores e penalidades graduais | T-089 | M | Ações registradas em histórico | ☐ |
| T-092 | Recrutar e treinar moderadores e fazer um beta fechado da comunidade | T-091 | M | Equipe pronta | ☐ |
| T-093 | Perfil social, com verificação obrigatória de Riot ID | T-063, T-092 | M | Perfis públicos funcionando | ☐ |
| T-094 | Conquistas, XP e sequências de metas | T-066, T-093 | M | Conquistas liberadas automaticamente | ☐ |
| T-095 | Procurar duo (LFG) | T-093 | G | Anúncios e filtros funcionando | ☐ |
| T-096 | Fórum e perguntas e respostas por campeão e patch | T-093 | G | Publicação e comentários | ☐ |
| T-097 | Revisão pela comunidade (comentários na linha do tempo da partida) | T-057, T-096 | G | Revisão publicada e comentada | ☐ |
| T-098 | Desafios entre amigos e ranking de evolução por faixa de elo | T-094 | G | Ranking atualizado | ☐ |
| T-099 | Ranking Brasil por campeão e por função | T-025 | M | Ranking exibido | ☐ |
| T-100 | Resumo de patch em português | T-049 | M | Resumo publicado a cada patch | ☐ |
| T-101 | Servidor de Discord da comunidade, integrado às contas | T-078 | M | Cargos por elo automáticos | ☐ |
| T-102 | Lições com momentos reais das partidas e desafios semanais de aprendizado | T-069, T-064 | G | Primeiro desafio semanal no ar | ☐ |

> **Marco 6: comunidade aberta, com moderação funcionando.**

### 19.13 Épico 10: Fase 7, expansão e sustentabilidade

| # | Tarefa | Depende | Esf. | Pronto quando | Status |
| --- | --- | --- | --- | --- | --- |
| T-103 | Planos premium: limites, pagamento por Pix e cartão | T-056, T-062 | G | Primeira assinatura concluída | ☐ |
| T-104 | Guias de usuários e selo de criador verificado | T-096 | M | Guias publicados | ☐ |
| T-105 | Mentoria e reputação de jogadores | T-095 | G | Mentores cadastrados | ☐ |
| T-106 | Times e clãs | T-098 | G | Página de time funcionando | ☐ |
| T-107 | Marketplace de coaches (verificação, agenda, avaliações e pagamento) | T-103, T-092 | G | Primeira sessão realizada | ☐ |
| T-108 | Eventos e torneios amistosos | T-106 | G | Primeiro torneio realizado | ☐ |
| T-109 | Widget para streamers e página de streamers e profissionais brasileiros (com autorização) | T-093 | M | Widget funcionando na transmissão | ☐ |
| T-110 | Cenário competitivo brasileiro (se houver fonte de dados permitida) | — | M | Calendário e resultados exibidos | ☐ |
| T-111 | Novos idiomas, outras regiões e outros modos de jogo | T-103 | G | Novo idioma ou região publicado | ☐ |

### 19.14 Guia rápido: terminei isso, qual é o próximo?

| Terminei | Próxima tarefa |
| --- | --- |
| Chave de desenvolvimento (T-001) | T-002: testar as chamadas da API |
| Design system (T-010) | T-011 e T-012: wireframes e telas finais |
| Telas finais (T-012) | T-013: protótipo e teste com jogadores; em paralelo, T-014 (fundação técnica) |
| Coletor de partidas (T-023) | T-024 e T-025: patch e agregação de estatísticas |
| Tier list (T-030) | T-031: pedir a chave de produção; depois T-032 (busca) |
| Tela do perfil (T-035) | **T-036: histórico de partidas** |
| Histórico de partidas (T-037) | T-038, T-039 e T-040, depois T-041 (detalhe da partida) |
| Detalhe da partida (T-041) | T-042: páginas de campeões |
| Fase 2 (T-046) | T-047: coletar a timeline das partidas |
| Beta da análise (T-060) | T-061: política de idade e termos, depois T-062 (contas) |
| Contas (T-071) | T-072: partida ao vivo |
| Fase 5 (T-087) | T-088: regras de moderação (nunca abra a comunidade antes) |
| Moderação pronta (T-092) | T-093: perfil social |

### 19.15 Histórico de revisões (continuação)

| Versão | Data | Descrição |
| --- | --- | --- |
| 0.2 | 16/10/2026 | Inclusão dos requisitos de comunidade brasileira (seção 18) e do backlog ordenado de desenvolvimento (seção 19) |

---

## 20. Resumo das políticas da Riot (tarefa T-003)

**Fontes consultadas em 18/10/2026:** documentação do Portal de Desenvolvedores, políticas gerais (atualizadas em 29/05/2025) e política do League of Legends. As regras mudam com o tempo, então releia antes de cada fase e antes de enviar o pedido de chave.

### 20.1 Tipos de chave

| Chave | Para que serve | Limites | Observações |
| --- | --- | --- | --- |
| Desenvolvimento | Testar e criar protótipo | Baixos; desativa a cada 24 horas | Gerada automaticamente ao entrar no portal. Não pode sustentar produto público |
| Pessoal | Projeto só do desenvolvedor ou comunidade privada pequena | 20 requisições por segundo e 100 a cada 2 minutos | **Proibido abrir ao público, inclusive em alfa ou beta aberto** |
| Produção | Produto aberto ao público | 500 requisições a cada 10 segundos e 30.000 a cada 10 minutos | Limites contados por região. Uma chave por produto. Dá acesso ao login oficial da Riot (RSO) |

### 20.2 Regras obrigatórias

- Exibir, em local bem visível, o aviso de que o produto não é endossado pela Riot. Sugestão de texto em português: *\[Nome do produto\] não é endossado pela Riot Games e não reflete as opiniões de pessoas oficialmente envolvidas na produção ou no gerenciamento das propriedades da Riot Games. Riot Games e todas as propriedades associadas são marcas comerciais ou registradas da Riot Games, Inc.* Confirme com a Riot se a tradução é aceita e mantenha o texto original em inglês disponível.
- Usar os recursos da Riot apenas pelo Data Dragon e pelo kit de imprensa; logos e marcas só quando for inevitável para o produto.
- Não copiar o estilo ou a função dos jogos da Riot, e não usar criptomoedas nem blockchain.
- Não atuar como intermediário de dados (*data broker*) entre a API e outra empresa.
- A chave nunca vai no código. Usar sempre HTTPS. Se houver equipe, o produto deve pertencer a um grupo no portal.
- **Toda funcionalidade nova ou alteração relevante deve ser auditada pela página do produto no portal.** Cada fase do roadmap precisa ser comunicada à Riot.
- A Riot ID substituiu o nome de invocador: a busca deve usar Nome#TAG, e as chamadas devem preferir o PUUID.

### 20.3 Monetização

- É obrigatório ter uma **camada gratuita**, que pode ter anúncios. Anúncios só no seu site, nunca em propriedades da Riot.
- O conteúdo cobrado precisa ser transformador (criar informação, percepção ou análise nova). A análise com IA se encaixa bem.
- Formas aceitas de cobrança: assinaturas, doações, financiamento coletivo, inscrição em torneios e moedas que não podem ser convertidas em dinheiro.
- Apostas e jogos de azar são proibidos. A cobrança não pode ser abusiva, e quem decide isso é a Riot.
- Torneios: mínimo de 20 participantes, pelo menos 70% das inscrições destinadas ao prêmio, regras de vitória justas e sem apostas.

### 20.4 Integridade do jogo

- Não usar informação ausente do cliente que dê vantagem competitiva (exemplo da Riot: rastrear a recarga de ultimate inimigo).
- Não criar vantagem injusta nem **ditar decisões** do jogador. É permitido destacar decisões importantes e oferecer **várias opções**.
- Aumentar, e não reduzir, a diversidade de escolhas (builds, composições e campeões).
- Não criar alternativa ao ranking oficial (por exemplo, calculadoras de MMR ou ELO).
- Não desanonimizar jogadores nem analisar jogadores ocultos pelo jogo.
- Não exibir taxa de vitória de aprimoramentos (augments) ou itens do Arena.
- Histórico de partidas personalizadas só pode ser público se o jogador permitir.

### 20.5 Como a Riot avalia o pedido de chave de produção

- Observa se o caso de uso é aprovado e se o desenvolvedor mostra que vai entregá-lo.
- Aceita como prova: app funcional, protótipo testável, **mockups** que mostrem o fluxo, ou apresentação com o fluxo do usuário.
- Pede um **link** para o site, protótipo ou mockup, com fluxos como criação de conta, login e busca.
- Quer produtos que ajudem o jogador a melhorar ou acompanhar a evolução. Um site incompleto tem pouca chance de aprovação.
- **Casos de uso aprovados que combinam com o projeto:** ferramentas de treino com histórico e estatísticas do próprio jogador, estatísticas agregadas, ferramentas de procurar grupo (LFG), torneios e leaderboards oficiais.

### 20.6 Impacto no projeto: pontos que exigem cuidado

| Item do documento | Risco | Ação recomendada |
| --- | --- | --- |
| Partida ao vivo (RF-LV-01 a RF-LV-06, T-072 a T-077) | **Alto.** A política veta informação da partida que o jogador não conheceria e a análise de jogadores ocultos | Perguntar à Riot antes de desenvolver. Priorizar dados já conhecidos (elo, histórico, maestria). Evitar mostrar runas e dados que o jogador não veria |
| Draft e dicas de confronto (RF-DR, RF-LV-06) | Médio. A política veta apps que ditam decisões | Sempre apresentar várias opções, explicar o motivo e nunca impor uma única escolha |
| Rankings de evolução e Ranking Brasil (RF-SC-06, RF-BR-04) | Médio. Pode ser visto como alternativa ao ranking oficial | Usar o ranking oficial da Riot como base e confirmar com a Riot antes de lançar |
| Marketplace de coaches (RF-SC-13, T-107) | Médio. Comissão por serviço não está entre as formas de cobrança listadas | Consultar a Riot pelo portal antes de construir |
| Planos premium (RF-BR-06, T-103) | Baixo. Assinaturas são aceitas | Manter camada gratuita relevante e conteúdo transformador |
| Torneios (RF-SC-12, T-108) | Baixo a médio | Respeitar mínimo de 20 participantes e 70% das inscrições em prêmios |
| Novos modos de jogo (T-111) | Médio | Não exibir win rate de augments ou itens do Arena |
| Verificação de Riot ID (RF-UA-02, T-063) | Baixo | Usar o login oficial da Riot (RSO), disponível só com chave de produção |
| Beta fechado da análise (T-060) | **Alto se feito antes da chave de produção** | Beta com testadores externos só depois da chave aprovada; antes disso, testar só você mesmo |

### 20.7 Ajuste no backlog

- **T-031 pode ser antecipado.** Como protótipos testáveis são aceitos, o pedido da chave de produção pode ser enviado assim que o protótipo web (T-013) e a landing (T-020) estiverem prontos, mostrando os fluxos de busca, perfil, análise e login. Não é preciso esperar a tier list funcionar.
- Antes de iniciar a fase 4B (partida ao vivo) e a fase 6 (comunidade), abrir uma conversa com a Riot pelo portal para confirmar os pontos de risco da tabela acima.

### 20.8 Histórico de revisões (continuação)

| Versão | Data | Descrição |
| --- | --- | --- |
| 0.3 | 18/10/2026 | Inclusão do resumo das políticas da Riot e da análise de impacto no projeto (seção 20), conclusão da tarefa T-003 |

---

## 21. Stack tecnológica e convenções do projeto (tarefa T-006)

**Status da decisão:** stack decidida em 20/10/2026; arquitetura modular web + worker definida em 12/11/2026. Esta versão substitui a recomendação anterior (Python + FastAPI no backend), com o objetivo de manter o desenvolvimento simples.

### 21.1 Resumo da decisão

- **TypeScript** no site, na API, no worker de coleta e nas chamadas ao modelo de linguagem que escreve o texto da análise.
- **Python** só será considerado para machine learning na fase 5, se houver necessidade comprovada. Não faz parte da primeira versão nem acessará diretamente o banco de produção.
- **Monólito modular:** site e API em Next.js; worker em Node.js separado como processo, no mesmo repositório. Ambos reutilizam os módulos de domínio e aplicação.
- **PostgreSQL com Prisma.** A fila de tarefas usa pg-boss, dentro do próprio PostgreSQL, então não é preciso Redis no início.
- **Por que assim:** uma linguagem cobre o produto inicial, o worker mantém tarefas demoradas fora das requisições web, e módulos com limites claros evitam a complexidade prematura de microserviços.

### 21.2 Fluxo geral

```
Jogador -> Next.js (interface + API) -> PostgreSQL / pg-boss -> Worker (TypeScript) -> API da Riot
               ^                              |                       |
               |                              +<-- dados/resultados --+
               +----------- lê dados persistidos e estado da tarefa --+
```

O worker também processa agregações e análises. Para análise pós-jogo, calcula e persiste métricas primeiro; só então solicita ao LLM uma explicação estruturada. A interface consulta o estado e apresenta o resultado quando estiver pronto. Assim, lentidão ou indisponibilidade da Riot/LLM não mantém uma requisição web aberta nem impede a exibição dos dados já calculados.

### 21.3 Ferramentas, linguagens e bibliotecas

| Camada | Ferramenta | Como é usada | Fase |
| --- | --- | --- | --- |
| Design | Descrição escrita + protótipo web | Direção visual, especificações e testes de telas sem depender do Figma | 0 |
| Linguagem | TypeScript (Node.js LTS) | Site, API, worker e chamadas ao modelo de linguagem | 1 |
| Site e API | Next.js (React) | Páginas, rotas de API e SEO, em um único projeto | 1 |
| Estilo | Tailwind CSS + shadcn/ui | Visual responsivo, temas claro e escuro, componentes prontos | 1 |
| Textos em português | next-intl | Organiza os textos do site e facilita traduções futuras | 1 |
| Validação | Zod | Valida os dados vindos da Riot e das rotas da API | 1 |
| Banco de dados | PostgreSQL | Partidas, estatísticas, benchmarks e usuários. Local: Docker. Produção: Neon ou Supabase | 1 |
| Acesso ao banco | Prisma | Define as tabelas, controla as migrações e faz as consultas | 1 |
| Coleta de dados | Worker em TypeScript (pasta `worker/`) | Coleta partidas, agrega estatísticas e gera análises em segundo plano | 1 |
| Fila de tarefas | pg-boss | Fila dentro do próprio PostgreSQL, sem Redis | 1 |
| Cliente da Riot | `fetch` do Node + Bottleneck | Módulo único com controle de limite de requisições e novas tentativas; o script `scripts/teste-riot.mjs` é a base | 1 |
| Cache | Cache do Next.js e tabelas no PostgreSQL | Redis só entra se a medição de uso mostrar necessidade | 2 |
| Cálculos e análise | TypeScript (`src/features/*/domain`) + SQL | Benchmarks, tiers, métricas e padrões do jogador; regras puras testáveis | 1 a 4 |
| Gráficos | Recharts | Gráfico de ouro, evolução e notas | 3 |
| Texto da análise | SDK TypeScript do Claude (`@anthropic-ai/sdk`) | Recebe as métricas já calculadas e escreve o texto em português | 3 |
| IA própria (machine learning) | Python: scikit-learn ou XGBoost, com Jupyter (pasta `ml/`) | Descobre o que mais pesa na vitória e prioriza os conselhos | 5 |
| Login | Auth.js | Cadastro e login; depois o login oficial da Riot (RSO) | 4 |
| Bot de Discord | discord.js | Comandos de perfil, última partida e análise | 5 |
| Imagens de compartilhamento | @vercel/og (Satori) | Cria o card da análise para Discord e WhatsApp | 4 |
| E-mail | Resend (ou similar) | Confirmação de conta e resumo semanal | 4 |
| Pagamentos | Mercado Pago, Asaas ou Stripe | Assinatura com Pix e cartão | 7 |
| Ambiente local | Docker Compose | Sobe o PostgreSQL com um comando | 0 |
| Código e automação | Git, GitHub, GitHub Actions | Versionamento e testes automáticos a cada alteração | 0 |
| Testes | Vitest; Playwright | Testes unitários e de ponta a ponta | 1 em diante |
| Qualidade de código | ESLint e Prettier (Ruff na pasta `ml/`) | Padronização e detecção de erros | 0 |
| Hospedagem | Vercel (site e API); Neon ou Supabase (banco); Railway ou Render (worker) | Publicação | 1 |
| Segurança e velocidade | Cloudflare | DNS, proteção contra ataques e cache | 2 |
| Monitoramento | Sentry (erros) e Uptime Kuma (disponibilidade) | Avisos quando algo quebra | 1 |
| Métricas de uso | Plausible ou Umami | Mede visitas respeitando a LGPD | 2 |
| Gestão de tarefas | GitHub Projects ou Trello | Quadro com o backlog da seção 19 | 0 |

### 21.4 Conjunto mínimo para a fase 1

Para a tier list, usar apenas: TypeScript com Next.js, Tailwind CSS, PostgreSQL com Prisma, um worker Node.js com pg-boss, Docker, validação com Zod e testes com Vitest. Login, e-mail, Discord, pagamentos e machine learning só entram quando a fase correspondente pedir. Não adicionar Redis nem microsserviços sem necessidade medida.

### 21.5 Estrutura de pastas (monorepo simples)

Esta é a estrutura-alvo do repositório. Criar as pastas conforme cada tarefa do backlog, sem gerar antecipadamente diretórios vazios ou implementar funcionalidades de fases futuras.

```
ahriademia/
├── documentação/
│   └── Documento de Requisitos – Plataforma de Análise de League of Legends (1).md
├── package.json               (scripts e dependências do workspace)
├── package-lock.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma          (modelo e migrações do banco)
├── scripts/
│   └── teste-riot.mjs         (teste manual de desenvolvimento, T-002)
├── src/
│   ├── app/                   (páginas e adaptadores HTTP do Next.js)
│   │   └── api/v1/            (rotas versionadas; sem regra de negócio)
│   │       └── health/        (verificação da conexão com o banco)
│   ├── components/ui/         (componentes visuais reutilizáveis)
│   ├── features/
│   │   ├── tier-list/
│   │   ├── players/
│   │   ├── matches/
│   │   └── analysis/          (cada módulo separa domain, application e ui)
│   ├── server/
│   │   ├── db/                (cliente Prisma e repositórios)
│   │   ├── queue/             (publicação de tarefas pg-boss)
│   │   ├── riot/              (cliente Riot usado pelo worker)
│   │   └── llm/               (provedor de texto usado pelo worker)
│   └── messages/              (textos da interface em pt-BR)
├── worker/
│   ├── jobs/                  (sincronização, agregação e análise)
│   └── index.ts               (inicialização do processo worker)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker-compose.yml
├── .env.example               (modelo, sem valores reais)
├── .gitignore
└── README.md
```

As rotas HTTP validam a entrada e chamam casos de uso; não contêm consultas Riot ou cálculos complexos. `domain` contém regras sem dependência de rede ou banco, `application` coordena os casos de uso, e `server` reúne adaptadores de infraestrutura. O worker pode chamar os mesmos casos de uso sem importar componentes de interface.

### 21.6 Convenções

- **Idiomas:** interface, textos de análise e documentação em português do Brasil. Nomes de variáveis, funções, tabelas e commits em inglês.
- **Git:** branch principal protegida; uma branch por tarefa, nomeada com o número (ex.: `feat/T-036-match-history`); commits pequenos no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`).
- **TypeScript:** modo estrito, ESLint e Prettier. Gerenciador de pacotes: npm.
- **Testes:** todo cálculo de estatística, tier, benchmark e métrica de análise precisa de teste unitário (Vitest); integrações com banco/serviços externos e fluxos críticos também precisam de testes de integração ou E2E.
- **Banco:** toda mudança de tabela passa por migração do Prisma; nunca alterar o banco manualmente em produção.
- **Dados da Riot:** somente o worker consulta a API em produção, por meio do cliente central com controle de taxa; identificar jogadores pelo PUUID e exibir o Riot ID (Nome#TAG) na interface; usar o Data Dragon em pt\_BR para nomes e imagens.
- **Regras de negócio:** cálculos são determinísticos e independentes do LLM; falha do LLM não apaga nem oculta métricas. Validar entradas e respostas externas com Zod e registrar erros com contexto, sem incluir chaves ou dados pessoais desnecessários.
- **Processamento assíncrono:** jobs precisam ser idempotentes, ter política explícita de retry/backoff e estado observável; não iniciar trabalhos longos dentro de uma rota web.
- **Machine learning:** não criar a pasta nem dependências Python antes da fase 5. Quando necessário, definir uma interface de dados própria e revisar segurança antes de conceder acesso a dados.

### 21.7 Variáveis de ambiente

Todas ficam em um arquivo `.env` (fora do Git). O repositório contém apenas o `.env.example`, sem valores reais.

| Variável | Uso |
| --- | --- |
| APP\_ENV | development, staging ou production |
| RIOT\_API\_KEY | Chave da API da Riot (nunca no código) |
| RIOT\_REQUEST\_INTERVAL\_MS | Intervalo mínimo entre chamadas à Riot; padrão local de 1200 ms |
| RIOT\_COLLECTION\_MAX\_PLAYERS | Limite de jogadores amostrados por coleta; padrão local de 8 |
| RIOT\_COLLECTION\_MATCHES\_PER\_PLAYER | Partidas ranqueadas recentes por jogador; padrão local de 3 |
| RIOT\_MIN\_CHAMPION\_GAMES | Amostra mínima por campeão/função para aparecer no ranking; padrão de 50, revisar antes de publicar |
| POSTGRES\_USER, POSTGRES\_PASSWORD, POSTGRES\_DB | Dados do PostgreSQL local (Docker) |
| DATABASE\_URL | Conexão com o PostgreSQL |
| ANTHROPIC\_API\_KEY | Chave da API do Claude para os textos de análise |

### 21.8 Regras que o código sempre deve respeitar

1. A chave da Riot nunca é escrita no código nem enviada ao navegador; todas as chamadas à Riot partem do servidor (site/API ou worker), por HTTPS.
2. Em produção, só o worker chama a Riot, sempre pelo cliente único em `src/server/riot`; ele controla taxa e trata 429 respeitando `Retry-After`. O script de T-002 é uma exceção apenas para teste manual local.
3. Respeitar as políticas da seção 20, em especial: não expor dados que o jogador não conheceria na partida, não ditar decisões e não criar rankings alternativos ao oficial.
4. Exibir o aviso de que o site não é endossado pela Riot em local visível.
5. Não usar chave de desenvolvimento para servir o público.

### 21.9 Decisões sobre a stack

| Decisão | Escolha | Quando |
| --- | --- | --- |
| Linguagem principal | TypeScript (Python só para machine learning) | Decidida |
| Acesso ao banco | Prisma | Decidida |
| Fila de tarefas | pg-boss (revisar se o volume exigir Redis) | Decidida |
| Gerenciador de pacotes | npm | Decidida |
| Provedor de login | Auth.js ou Supabase Auth | T-062 |
| Hospedagem do banco | Neon ou Supabase | T-018 |
| Arquitetura | Monólito modular + worker separado no mesmo repositório | Decidida |
| Hospedagem do worker | Railway ou Render | T-018 |
| Biblioteca de gráficos | Recharts (padrão) ou ECharts | T-052 |
| Gateway de pagamento | Mercado Pago, Asaas ou Stripe | T-103 |

### 21.10 Instruções para assistentes de IA que trabalharem neste repositório

Esta seção orienta ferramentas de IA (editores com assistente, agentes de código) a trabalharem de forma consistente com o projeto. Um resumo dela está no arquivo `AGENTS.md`, na raiz do repositório.

1. **Leia antes de programar:** as seções 3 a 5 (requisitos e regras), 19 (backlog), 20 (políticas da Riot), 21 (stack e convenções) e 22 (identidade e situação atual).
2. **Siga a ordem do backlog (seção 19).** Trabalhe em uma tarefa por vez, na numeração T-xxx. Não antecipe tarefas de fases futuras sem pedido explícito do desenvolvedor.
3. **Antes de implementar,** confirme a tarefa, suas dependências e o critério de pronto. Se algo estiver ambíguo ou faltar uma decisão (ver 21.9), pergunte em vez de supor.
4. **Conflito com as políticas da Riot (seção 20):** pare e avise o desenvolvedor antes de continuar. Não implemente recursos marcados como risco alto sem confirmação.
5. **Segurança:** nunca escreva chaves ou senhas no código, em testes ou em arquivos versionados; use variáveis de ambiente.
6. **Qualidade:** escreva testes para toda regra de cálculo, siga as convenções da seção 21.6 e mantenha as mudanças pequenas e fáceis de revisar.
7. **Ao concluir uma tarefa:** atualize o status (☐, ◐, ☑) na seção 19 e a situação atual na seção 22.4, e descreva brevemente o que foi feito e como testar.
8. **Textos para o usuário final** devem estar em português do Brasil, com tom construtivo; nunca rotular ou humilhar jogadores (RF-MD-07).

A situação atual do projeto está na seção 22.4.

### 21.11 Histórico de revisões (continuação)

| Versão | Data | Descrição |
| --- | --- | --- |
| 0.4 | 18/10/2026 | Primeira versão da stack tecnológica, estrutura de pastas, convenções e instruções para assistentes de IA (seção 21) |
| 0.6 | 20/10/2026 | Stack revisada para TypeScript em todo o projeto, com Python apenas para machine learning; esqueleto do repositório e script de teste em Node.js |

---

## 22. Identidade do projeto e rascunho do pedido de chave (tarefas T-004 e T-007)

### 22.1 Identidade escolhida

| Item | Definição |
| --- | --- |
| Nome | **Ahriademia** |
| Slogan | **Sua academia para evoluir no Rift.** |
| Aviso obrigatório da Riot (texto sugerido) | *Ahriademia não é endossado pela Riot Games e não reflete as opiniões de pessoas oficialmente envolvidas na produção ou no gerenciamento das propriedades da Riot Games. Riot Games e todas as propriedades associadas são marcas comerciais ou registradas da Riot Games, Inc.* |

**Pendências da T-004 (precisam ser feitas pelo desenvolvedor):**

1. Registrar o domínio (o desenvolvedor informou que os domínios estão livres; ex.: ahriademia.com.br no Registro.br, com ahriademia.gg ou ahriademia.com como alternativas).
2. Verificar e reservar os nomes nas redes sociais (Instagram, X, TikTok, YouTube, Discord).
3. Pesquisar o nome na base de marcas do INPI, para checar se já existe registro em classes parecidas (software e serviços online). O nome contém Ahri, que é um campeão de League of Legends (propriedade intelectual da Riot Games). Consulte a Riot pelo portal de desenvolvedores sobre o uso do nome e confirme com um advogado ou especialista em marcas antes de investir na identidade visual.
4. Pesquisar se já existe site ou ferramenta de LoL com o mesmo nome, para evitar confusão.

### 22.2 Situação das tarefas do épico 0

| Tarefa | Situação | Quem faz |
| --- | --- | --- |
| T-001 | **Concluída** (chave de desenvolvimento gerada no portal da Riot; manter segredo no ambiente local) | Desenvolvedor (login com a conta Riot) |
| T-002 | **Concluída** (chamadas testadas: PUUID, elo e partidas recentes; respostas confirmadas no terminal) | Desenvolvedor roda o script scripts/teste-riot.mjs (Node.js); o assistente ajuda com erros |
| T-003 | **Concluída** (seção 20) | Assistente |
| T-004 | ◐ Em andamento (nome e slogan definidos; disponibilidade dos domínios pretendidos informada pelo desenvolvedor; domínio ainda não comprado) | Desenvolvedor |
| T-005 | **Concluída** (repositório Git criado, backlog copiado para a seção 19 deste documento e padrões de contribuição registrados em `CONTRIBUTING.md`) | Desenvolvedor, com o assistente de IA do editor |
| T-006 | **Concluída** (stack registrada na seção 21: TypeScript no site e na API; Python só para machine learning) | Desenvolvedor |
| T-007 | **Concluída** (rascunho pronto na seção 22.3; revisão final antes do envio) | Assistente escreveu; desenvolvedor revisa |

### 22.3 Rascunho da descrição para o pedido da chave de produção (T-007)

O formulário da Riot é em inglês, por isso o texto abaixo está em inglês. Antes de enviar, substituir os campos entre colchetes e revisar o texto para refletir exatamente o que o produto faz **no momento do envio**.

> **Product name:** Ahriademia
>
> **Tagline:** Sua academia para evoluir no Rift. (Your academy to improve on the Rift)
>
> **Description:** Ahriademia is a free web platform for Brazilian League of Legends players who want to understand their mistakes and improve. Players search for their own Riot ID and see their match history, statistics by champion and role, and a post-game analysis that compares each match with aggregated benchmarks from players of the same rank and champion. The platform explains the results in clear Portuguese (what went well and what can be improved) and suggests small weekly goals so players can track their progress over time. A public tier list shows aggregated champion statistics (win rate, pick rate and ban rate) by role, patch and rank.
>
> **Target audience:** Casual and competitive League of Legends players in Brazil (BR1).
>
> **Use cases (from the approved list):** training and improvement tool based on the player's own match history; aggregated player and champion statistics.
>
> **Riot data used in the first release:** account-v1, summoner-v4, league-v4, match-v5 (match details and timelines), champion-mastery-v4. Static data and images come from Data Dragon.
>
> **What the product will not do:** it will not show live-game information, hidden information or data a player would not already know during a match; it will not calculate MMR or create an alternative to the official ranked ladder; it will not dictate in-game decisions; it will not show win rates for Arena augments or items; it will not make custom game history public without the player's consent.
>
> **How we use the API:** all calls are made server-side over HTTPS. The API key is never exposed to the browser or stored in the code. We use a single rate-limit-aware client with caching and retry handling for 429 responses, and we identify players by PUUID, displaying the Riot ID in the interface.
>
> **Monetization:** the core features are free for all players. In the future we may offer an optional premium subscription with higher analysis limits. No advertising will be placed on Riot properties.
>
> **Riot disclaimer:** displayed in the footer of every page and on the landing page.
>
> **Privacy:** privacy policy and terms of use are available at \[link\]. Players can request the deletion of their data.
>
> **Links:** landing page \[link da landing\]; testable web prototype \[link do ambiente de teste\]; the prototype shows account creation, login, player search, profile, tier list and post-game analysis.
>
> **Contact:** \[e-mail do projeto\].

**Checklist antes de enviar:**

1. Landing publicada com política de privacidade, termos e aviso da Riot (T-020).
2. Protótipo web acessível no ambiente de teste, com os fluxos de criar conta, login, busca, perfil, tier list e análise que já estiverem implementados.
3. E-mail de contato do projeto criado.
4. Texto acima revisado e sem nenhuma funcionalidade que ainda não esteja no protótipo.
5. Recursos de risco (partida ao vivo, rankings próprios, marketplace de coaches) deixados de fora do primeiro pedido, conforme a seção 20.6.

### 22.4 Estado atual do projeto

Projeto: **Ahriademia**. T-001, T-002, T-003, T-005, T-006, T-007, T-014, T-015 e T-021 a T-024 estão concluídas. A T-004 permanece em andamento: nome e slogan definidos e disponibilidade dos domínios pretendidos informada pelo desenvolvedor; o domínio ainda não foi comprado. A T-005 está concluída com o repositório Git, o backlog na seção 19 e as convenções em `CONTRIBUTING.md`. A T-014 foi validada localmente: PostgreSQL saudável no Docker, endpoint de saúde respondendo com banco conectado e worker conectado ao PostgreSQL. A T-015 foi concluída: o frontend Next.js, a identidade visual aplicada à tela da tier list e os textos em português estão implementados para execução local; isso não significa que todas as telas do protótipo (T-012) estejam prontas. T-016 está parcialmente implementada: o cliente Riot tem intervalo mínimo entre chamadas, novas tentativas para falhas de rede, 429 e 5xx, e erros tipados, mas falta validar o controle de taxa no worker e garantir o registro explícito das falhas. T-017 está parcialmente implementada: existe consulta ao Data Dragon para catálogo de campeões, mas os dados não são persistidos no banco e itens, runas, imagens e atualização automatizada por patch ainda faltam. T-018, T-019 e T-020 continuam pendentes: não há staging protegido/CI, monitoramento com alertas e backup automático, nem landing publicada com páginas legais e aviso da Riot. T-022 e T-023 já coletam e persistem jogadores amostrados e partidas; o job de agregação de T-025 e a fórmula de T-026 estão implementados e cobertos por testes, mas T-025 permanece parcial porque a execução com mínimo configurado de 50 partidas não gerou registros na tabela oficial: nenhum grupo campeão/função atingiu a amostra, então é necessário coletar mais partidas antes de satisfazer o critério “Tabela de estatísticas gerada”. O KDA segue a definição documentada de média por partida de `(abates + assistências) / max(mortes, 1)`. T-027 está concluída e foi validada com respostas oficiais e preliminares, filtros e cache; a API mantém a classificação oficial vazia quando não há dados que atinjam o mínimo. T-028 segue em andamento: a tela está integrada e foi testada no navegador com filtros de rota/elo, mas a comparação real entre patches ainda depende de estatísticas oficiais em patches consecutivos. T-029 está concluída: carregamento, vazio e erro verificados; a página não gera rolagem horizontal nem a 320 px, mantendo a tabela rolável dentro de seu contêiner. T-030 permanece em andamento, pois a conferência de classificação oficial depende de amostra suficiente. T-032 está concluída: a API valida o Riot ID, consulta o PUUID na Riot sem expô-lo ao navegador e trata formato inválido, conta não encontrada, região não habilitada e limitação de requisições com mensagens em português. T-033 está concluída: a home permite buscar na região BR, separar automaticamente um Riot ID colado em qualquer campo, reaproveitar buscas recentes e encaminhar a conta validada para a área do jogador; os estados de carregamento e erro são acessíveis. T-034 está concluída: a busca consulta account-v1, summoner-v4 e league-v4 no servidor e persiste Riot ID, nível, ícone e entradas ranqueadas (elo, divisão, LP, vitórias e derrotas) no PostgreSQL; perfis sem ranqueada são salvos com a lista de filas vazia. A tela detalhada continua na T-035. A migração de faixas cumulativas de elo e a migração de perfis foram aplicadas localmente. Foram consultados 8 jogadores e persistidas 27 partidas ranqueadas do BR; no patch 16.22 há 9 partidas e a prévia identifica 69 combinações campeão/função. Nenhuma combinação atingiu o mínimo local de 50 jogos para publicação oficial, portanto essa prévia continua explicitamente não confiável. T-031 depende de T-030, da landing/ambiente de teste de T-020 e do registro externo do produto na Riot; permanece pendente. A T-013 (teste com jogadores) permanece pendente. A compra do domínio continua sendo uma pendência da identidade (T-004), sem impedir as tarefas já concluídas deste épico.

### 22.5 Histórico de revisões (continuação)

| Versão | Data | Descrição |
| --- | --- | --- |
| 0.5 | 18/10/2026 | Nome e slogan do projeto, rascunho do pedido de chave de produção e situação das tarefas do épico 0 (seção 22) |

### 22.6 Histórico de revisões (continuação)

| Versão | Data | Descrição |
| --- | --- | --- |
| 0.7 | 21/10/2026 | Mudança do nome do projeto para Ahriademia e do slogan para Sua academia para evoluir no Rift.; atualização dos pendentes da T-004 e do pacote de arquivos (ahriademia-base.zip) |
| 0.8 | 21/10/2026 | Situação atualizada com o trabalho feito no repositório: T-005 em andamento (quadro de tarefas pendente) e T-006 concluída |
| 0.9 | 21/10/2026 | Alinhamento dos status do backlog principal com a situação do épico 0 e correção da versão do documento |
| 1.0 | 12/11/2026 | Definição da arquitetura de monólito modular com worker separado, fluxos assíncronos, limites entre módulos e estrutura-alvo do repositório; alinhamento do README e das convenções |
| 1.1 | 12/11/2026 | Início da T-014: esqueleto web/API, Prisma, worker pg-boss, PostgreSQL local com Docker Compose e instruções de execução |
| 1.2 | 13/11/2026 | T-014 validada localmente com PostgreSQL saudável, endpoint de saúde e worker conectados; atualização da situação do projeto e das próximas dependências de design |
| 1.3 | 13/11/2026 | Substituição do Figma por especificações escritas e protótipo web; registro da direção visual da tier list e início das tarefas T-010, T-011, T-012 e T-015 |
| 1.4 | 13/11/2026 | Filtros de rota em abas com ícones e painel lateral de detalhes por hover/foco |
| 1.5 | 13/11/2026 | Painel compacto de estatísticas inspirado na referência enviada; removida navegação ao perfil, não desejada nesta etapa |
| 1.6 | 13/11/2026 | Modelagem e migração de dados da tier list, coleta limitada via Riot, agregação testada, fórmula inicial de tier e endpoint filtrado/cacheado; status T-021 a T-027 atualizado |
| 1.7 | 13/11/2026 | Integração da tela com a API e prévia local sinalizada para amostras ainda abaixo do mínimo oficial |
| 1.8 | 13/11/2026 | Faixas cumulativas de elo persistidas, filtros da API corrigidos, estados e responsividade da tela validados; status de T-027 e T-029 atualizado |
| 1.9 | 13/11/2026 | T-001, T-002 e T-005 do épico 0 marcadas como concluídas; T-004 permanece em andamento até a compra do domínio |
| 2.0 | 13/11/2026 | Revisão do épico 2: T-015 concluída, T-016 e T-017 parcialmente implementadas, T-018 a T-020 pendentes |
| 2.1 | 13/11/2026 | Revisão de T-025: cálculo de KDA alinhado à definição documentada e coberto por teste; reprocessamento local de 11 patches gerou 0 estatísticas oficiais por amostra abaixo do mínimo, então a tarefa permanece parcial |
| 2.2 | 13/11/2026 | Início de T-032: endpoint de busca por Riot ID com validação, consulta ao PUUID, erros em português e testes; CT-01 continua pendente do perfil com elo/estatísticas |
| 2.3 | 14/11/2026 | T-033 marcada como parcial: home responsiva implementada, mas busca e seletor de região permanecem desabilitados até integração funcional com T-032 |
| 2.4 | 14/11/2026 | Busca BR conectada à home, mensagens de erro e redirecionamento implementados; PUUID mantido no servidor e CT-01 delimitado ao escopo de T-032/T-033 |
| 2.5 | 14/11/2026 | Erro HTTP 401/403 da Riot orienta a validar a chave carregada pelo servidor sem expor credenciais |
| 2.6 | 14/11/2026 | Prazo de expiração de 24 horas da chave de desenvolvimento registrado nas restrições |
| 2.7 | 16/11/2026 | T-034 concluída: coleta account-v1, summoner-v4 e league-v4, persistência de perfil e filas ranqueadas com migração e testes |
| 2.8 | 17/11/2026 | Workflow do GitHub definido como agendador único; cron executa às 00:17, 10:17 e 20:17 UTC e o worker não agenda coletas paralelas |

---

## 23. Direção visual e especificação da primeira tela

Esta seção registra a descrição dada pelo desenvolvedor para a primeira tela. O processo de design usa texto, implementação local e revisão no navegador; Figma não é requisito. Referências servem apenas para inspiração: não copiar layouts, ícones, cores ou textos de outros produtos.

### 23.1 Identidade visual da tier list

| Uso | Cor |
| --- | --- |
| Fundo | `#0A0A0C` |
| Superfícies | `#131316`, `#1B1B20` |
| Borda | `#2A2A31` |
| Marca | `#E11D48`; hover `#FF3B5C`; brilho escuro `#7F1020` |
| Texto principal / secundário / apagado | `#F4F4F6` / `#B3B3BD` / `#8A8A96` |

Tipografia: títulos condensados e fortes (exemplo: Barlow Condensed) e texto de interface em estilo Inter. Cards têm um canto diagonal recortado e textura de fundo discreta. A faixa S+ recebe brilho vermelho suave. A cor não é o único identificador: cada função tem um ícone próprio criado para o projeto.

| Função | Cor semântica | Tier | Cor |
| --- | --- | --- | --- |
| Topo | `#A78BFA` | S+ | Vermelho vivo com brilho |
| Selva | `#34D399` | S | `#FF6B57` |
| Meio | `#4F8CFF` | A | `#F5B14A` |
| ADC | `#FACC15` | B | `#B4B8C5` |
| Suporte | `#22D3EE` | C | `#7B8294` |
|  |  | D | `#565B6B` |

### 23.2 Conteúdo e interação

- Cabeçalho próprio com marca, navegação, busca de Riot ID e entrada de conta. Funcionalidades ainda não implementadas devem aparecer claramente como indisponíveis ou “em breve”.
- Cabeçalho da página com “Tier List”, patch, região, faixa de elo e quantidade de partidas analisadas; três destaques do patch (maior subida, mais banido, maior win rate).
- Barra de filtros persistente durante a rolagem; tiers apresentados em faixas de S+ a D, com quantidade e descrição simples. Tiers sem resultados são compactos e informam que não há campeões.
- Cards de campeão em orientação vertical, aproximadamente 120 × 180 px em desktop e 96 × 144 px em celular. Usar `championId` do Data Dragon e arte oficial de carregamento em `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/{championId}_0.jpg`, com recorte no topo. Borda de 3 px na cor da função; rodapé escuro com nome e pontuação.
- Um campeão com mais de uma função tem um card por função. Ao destacar um card, os outros cards do mesmo campeão ficam realçados e os demais perdem destaque.
- Apresentar as rotas como botões horizontais com ícone e nome, no estilo da referência visual enviada; destacar a rota selecionada e permitir voltar à visão geral.
- No mouse e no foco do teclado, mostrar um painel compacto ao lado do card após breve atraso; posicionar à esquerda quando faltar espaço à direita, manter aberto ao mover o ponteiro para o painel e fechar com Escape. O card serve para revelar informações, sem navegar para outra página.
- O painel apresenta retrato, nome, rota e as métricas Tier, Score, Win %, Pick %, KDA, Games, Role % e Ban %. Reutiliza os dados carregados, sem nova chamada.
- Oferecer visualização por tiers ou tabela ordenável, comparação com patch anterior, busca por nome em português ou inglês sem diferenciar acentos/maiúsculas, ordenação e tamanhos de card. A busca realça correspondências sem remover outros cards; Enter foca o primeiro resultado.
- Filtros selecionados são compartilháveis na URL (`funcao`, `elo`, `patch`, `regiao`). Região BR começa ativa; regiões ainda indisponíveis permanecem desabilitadas com “em breve”. Oferecer contagem de resultados, limpar filtros e estados vazios amigáveis.
- Não induzir conclusão com amostra insuficiente: exibir aviso de amostra baixa e não apresentar números enganosos. Respeitar navegação por teclado e preferência por movimento reduzido.
- Rodapé inclui o slogan do projeto e o aviso obrigatório de não endosso pela Riot, conforme seção 20.

### 23.3 Dados e limite do protótipo

O front-end recebe a função e o tier já calculados; não calcula tiers. Cada entrada segue o contrato:

```ts
type ChampionEntry = {
  championId: string;
  name: string;
  role: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
  tier: "S+" | "S" | "A" | "B" | "C" | "D";
  score: number;
  winRate: number;
  pickRate: number;
  banRate: number;
  kda: number;
  games: number;
  roleRate: number;
  tierChange?: "UP" | "DOWN" | "SAME";
  lowSample?: boolean;
  difficulty?: number;
};
```

A tela consome a API do produto. Em desenvolvimento, `amostra=preliminar` permite visualizar a agregação das partidas persistidas abaixo do mínimo oficial; a resposta não tem cache e sinaliza cada entrada com `lowSample`. Essa prévia é apenas diagnóstica: tiers e scores não são confiáveis. Em produção, a API continua exibindo apenas estatísticas que atingiram o mínimo de partidas e diversidade. Retratos e nomes de campeões vêm do Data Dragon; estatísticas vêm da API do produto e são agregadas no servidor/worker, nunca no navegador.

#### Fórmula inicial de pontuação (T-026)

Para cada combinação patch, elo e função, os campeões elegíveis são comparados por percentil (ranking médio para empates) em cada métrica. Só há tier quando a coorte tem ao menos 5 campeões elegíveis; isso evita atribuir uma classificação relativa sem diversidade suficiente.

- Percentil do win rate: 50% do score.
- Percentil do pick rate: 20%.
- Percentil do ban rate: 20%.
- Percentil do KDA: 10%.
- Confiança amostral: aproxima o score de 50 enquanto a amostra é pequena, com `confiança = jogos / (jogos + 100)`. O score final é `50 + (scorePercentilPonderado - 50) × confiança`, arredondado a duas casas.

Faixas iniciais: S+ ≥ 90; S ≥ 80; A ≥ 65; B ≥ 50; C ≥ 35; D < 35. Só entram no ranking combinações com pelo menos 50 jogos (ajustável por ambiente). Os pesos, faixas, prior de 100 jogos e mínimo de 50 são hipóteses iniciais explícitas e testadas, não uma calibração competitiva. Antes da publicação, comparar com uma amostra maior e revisar com métricas históricas; não reduzir o mínimo apenas para preencher a tela.

Pick rate usa as partidas da amostra em que o campeão/função apareceu divididas pelo total de partidas da amostra; ban rate usa partidas da amostra em que o campeão foi banido; Role % é a fração das partidas do campeão atribuída à função; KDA é a média por partida de `(abates + assistências) / max(mortes, 1)`.

#### Coleta e endpoint

- `npm run tierlist:collect` faz uma coleta manual limitada. O workflow `.github/workflows/coleta-tierlist.yml` é o agendador automático principal e executa às 00:17, 10:17 e 20:17 UTC (07:17, 17:17 e 21:17 em Brasília). Por ser um cron de calendário do GitHub Actions, os intervalos reais alternam entre 10, 10 e 4 horas; não é possível representar um intervalo contínuo exato de 10 horas nesse agendador. O worker consome jobs da fila, mas não agenda coletas recorrentes para evitar duplicidade.
- A coleta BR consulta listas de jogadores por faixa de elo, limita o número de jogadores e partidas por variáveis de ambiente, respeita intervalo e `Retry-After`, deduplica partidas/participantes e reprocessa o histórico persistido do patch afetado.
- A faixa de elo atribuída a uma partida é a do jogador amostrado que forneceu seu histórico; como Match-V5 não informa o elo histórico dos outros nove participantes, esse filtro é uma aproximação e deve ser comunicado como tal.
- Os filtros “Ferro+” até “Diamante+” são cumulativos: a agregação do worker combina as amostras de jogadores daquela faixa e das faixas superiores, deduplicando cada partida. “Mestre+” corresponde à amostra Master/Grandmaster/Challenger. A faixa continua sendo uma aproximação baseada no jogador amostrado, não no elo histórico de todos os participantes.
- `npm run tierlist:aggregate` reprocessa as partidas já salvas sem novas chamadas à Riot.
- `GET /api/v1/tier-list?regiao=br&patch=16.22&elo=all&funcao=all` consulta estatísticas oficiais persistidas. Os filtros aceitos são BR, patches numéricos, elos e funções definidos na tela; respostas têm cache de cinco minutos. Em desenvolvimento, acrescentar `amostra=preliminar` calcula uma prévia a partir das partidas persistidas, sem cache e sem alterar o mínimo oficial; essa opção é desabilitada em produção.
