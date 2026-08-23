# Plano de Implementação — MVP DBS TELECOM

## Progresso

### ✅ Etapa 1 — Patterns do club-api (CONCLUÍDA)
- [x] [base-errors.ts](file:///c:/Users/Bruno/OneDrive/Documentos/dbs-e2e/DBS/backend/src/errors/base-errors.ts) — Classes de erro tipadas
- [x] [errorHandler.ts](file:///c:/Users/Bruno/OneDrive/Documentos/dbs-e2e/DBS/backend/src/errors/errorHandler.ts) — Error handler global (sem Sentry/JWT)
- [x] [validation-sanitizer.ts](file:///c:/Users/Bruno/OneDrive/Documentos/dbs-e2e/DBS/backend/src/errors/validation-sanitizer.ts) — Sanitizador Zod pt-BR
- [x] [version.ts](file:///c:/Users/Bruno/OneDrive/Documentos/dbs-e2e/DBS/backend/src/utils/version.ts) — Utility de versão
- [x] [app.ts](file:///c:/Users/Bruno/OneDrive/Documentos/dbs-e2e/DBS/backend/src/app.ts) — Error handler registrado + health com versão
- [x] Validação de imports ✅

---

### 🔄 Etapa 2 — Backend: Rota de Chat (EM ANDAMENTO)

O coração do MVP. Sem isso, nenhum fluxo funciona de ponta a ponta.

#### 2.1 Fix env duplicado
- [ ] Corrigir import do [ixc-get-client.services.ts](file:///c:/Users/Bruno/OneDrive/Documentos/dbs-e2e/DBS/backend/src/services/ixc-get-client.services.ts) — aponta pra `../../env/index.ts` (raiz), deveria ser `../env/index.ts` (src)
- [ ] Adicionar tipagem nos retornos (`IXCCliente`, `IXCBoleto`)
- [ ] Adicionar busca de contrato/plano do cliente

#### 2.2 Session Manager (NOVO)
- [ ] `src/services/session-manager.ts`
- Sessões de chat in-memory (Map)
- `createSession()`, `getSession()`, `addMessage()`
- TTL de 30min com cleanup automático

#### 2.3 Tool Executor (NOVO)
- [ ] `src/services/tool-executor.ts`
- Executa toolCalls retornadas pela IA
- `consultar_faturas_ixc` → chama `getBoletosByClienteId()`
- `encaminhar_departamento` → registra encaminhamento
- `verificar_status_conexao_ixc` → consulta IXC

#### 2.4 AIService Refactor
- [ ] Suporte a histórico de mensagens (multi-turno)
- [ ] Substituir `console.log` pelo Logger
- [ ] Adicionar timeout na chamada HTTP (15s)

#### 2.5 Rota `/api/chat` (NOVO)
- [ ] `src/routes/chat.ts`
- Recebe `{ sessionId?, clienteId, cpfCnpj, mensagem }`
- Orquestra: sessão → contexto IXC → IA → tool execution → resposta
- Registrar no `app.ts`

---

### ⬜ Etapa 3 — Mobile (PENDENTE)

- [ ] Trocar tabs por Stack navigator
- [ ] Tela Home — branding DBS + botão iniciar
- [ ] Tela Identify — input CPF/CNPJ + chamada backend
- [ ] Tela Chat — interface de chat completa
- [ ] Services (api client) + types
- [ ] Tema com cores DBS

---

### ⬜ Etapa 4 — Documentação (PENDENTE)

- [ ] README completo (arquitetura, setup, fluxos, tecnologias)
- [ ] Diagrama de fluxo (mermaid)
- [ ] Instruções de instalação e execução
- [ ] Documentação da integração IXC

---

## Arquivos Existentes (Referência)

| Arquivo | Status | Notas |
|---|---|---|
| `src/env/index.ts` | ✅ OK | Fonte de verdade do env |
| `env/index.ts` (raiz) | ⚠️ Duplicado | Será eliminado do fluxo |
| `src/services/AIService.ts` | 🟡 Refactor | Precisa multi-turno + logger |
| `src/services/ixc-get-client.services.ts` | 🟡 Fix | Import errado + tipagem |
| `src/routes/identify.ts` | 🟡 Enriquecer | Retornar dados completos |
| `src/utils/agent-config.ts` | ✅ OK | Config do agente |
| `src/utils/logger.ts` | ✅ OK | Logger estruturado |
