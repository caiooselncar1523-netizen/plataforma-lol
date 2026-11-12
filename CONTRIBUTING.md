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
- Python só será introduzido para machine learning na fase 5; quando isso ocorrer, deve ser tipado e validado pelo Ruff.
- TypeScript deve usar modo estrito, ESLint e Prettier.
- Toda alteração do banco deve usar migração Prisma.
- Erros devem ser explícitos e seguir o padrão de logging da camada.
- Rotas HTTP validam entradas e delegam regras de negócio aos módulos da aplicação.
- Tarefas demoradas e chamadas Riot em produção são processadas pelo worker, não dentro de requisições web.

## Segurança e dados

- Nunca versionar chaves, senhas ou dados pessoais.
- Todas as chamadas à Riot em produção devem passar pelo cliente central do worker.
- Não expor no navegador dados que o jogador não conheceria durante a partida.
- Validar entradas na borda da aplicação e aplicar as regras de privacidade da
  LGPD.

## Testes

Toda regra de negócio e cálculo estatístico novo deve ter teste unitário. Use
testes de integração para banco, API da Riot e serviços externos, mantendo
credenciais reais fora dos testes.
