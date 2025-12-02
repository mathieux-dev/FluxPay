# Contributing to FluxPay

## Git Configuration

```bash
git config user.name "mathieux-dev"
git config user.email "mateusvmourao@gmail.com"
```

## Commit Strategy

Este projeto segue o padrão **Conventional Commits** para mensagens de commit.

### Formato

```
<type>: <description>

[optional body]
```

### Types

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações na documentação
- `style`: Formatação, ponto e vírgula faltando, etc
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Tarefas de manutenção, configuração, etc
- `ci`: Alterações em CI/CD

### Quando Fazer Commits

Commits devem ser feitos após completar cada **tarefa principal** (numeradas como 1, 2, 3, etc.) no arquivo `tasks.md`.

#### Exemplos de Commits por Tarefa

- **Task 1**: `feat: setup project structure and core infrastructure`
- **Task 2**: `feat: implement database models and migrations`
- **Task 3**: `feat: implement encryption and cryptography services`
- **Task 4**: `feat: implement HMAC signature services`
- **Task 5**: `feat: implement nonce store and replay protection`
- **Task 6**: `feat: implement rate limiting service`
- **Task 7**: `feat: implement JWT authentication service`
- **Task 8**: `feat: implement audit logging service`
- **Task 9**: `feat: implement provider adapters (Pagar.me and Gerencianet)`
- **Task 10**: `feat: implement payment service (card, PIX, boleto, refunds)`

### Workflow

1. Complete uma tarefa principal e suas sub-tarefas
2. Execute os testes para garantir que tudo está funcionando
3. Adicione os arquivos alterados: `git add .`
4. Faça o commit com mensagem descritiva seguindo o padrão
5. Continue para a próxima tarefa

### Verificação Antes do Commit

Antes de cada commit, certifique-se de:

- [ ] Código compila sem erros: `dotnet build`
- [ ] Testes passam: `dotnet test`
- [ ] Código segue as convenções do projeto
- [ ] Mensagem de commit é clara e descritiva

## Branch Strategy

- `main`: Branch principal com código estável
- Feature branches: Criar branches para features grandes se necessário

## Code Review

- Código deve ser revisado antes de merge para main
- Garantir que todos os testes passam
- Verificar conformidade com os requisitos da spec
