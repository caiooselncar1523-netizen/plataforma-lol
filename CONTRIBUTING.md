# Convenções de contribuição

## Fluxo de trabalho

- Trabalhe em uma branch por tarefa, usando o identificador do backlog, por
  exemplo `feat/T-014-backend-foundation`.
- Mantenha cada alteração pequena e relacionada a uma única tarefa.
- Atualize a documentação diretamente relacionada à mudança.
- Não implemente tarefas futuras sem confirmar a dependência e o escopo.

## Commits

Use Conventional Commits:

- `feat:` para funcionalidade;
- `fix:` para correção;
- `test:` para testes;
- `docs:` para documentação;
- `chore:` para manutenção.

## Código

- Variáveis, funções, classes, tabelas e commits devem usar nomes em inglês.
- Textos exibidos ao usuário devem estar em português do Brasil.
- Python deve ser tipado e validado pelo Ruff.
- TypeScript deve usar modo estrito, ESLint e Prettier.
- Toda alteração de schema deve usar migração Alembic.
- Erros devem ser explícitos e seguir o padrão de logging da camada.

## Segurança e dados

- Nunca versionar chaves, senhas ou dados pessoais.
- Todas as chamadas à Riot devem passar pelo cliente central do backend.
- Não expor no navegador dados que o jogador não conheceria durante a partida.
- Validar entradas na borda da aplicação e aplicar as regras de privacidade da
  LGPD.

## Testes

Toda regra de negócio e cálculo estatístico novo deve ter teste unitário. Use
testes de integração para banco, API da Riot e serviços externos, mantendo
credenciais reais fora dos testes.
