import type { AIChatMessage, AIClassificationResponse, ClienteContexto } from './AIService.ts';
import { Logger } from '../utils/logger.ts';

const logger = new Logger(undefined, 'session-manager');

export interface ChatSession {
  id: string;
  clienteId: string;
  contexto: ClienteContexto;
  mensagens: AIChatMessage[];
  departamentoAtual: string | null;
  criadoEm: Date;
  ultimaAtividade: Date;
}

// TTL de 30 minutos pra limpar sessões inativas
const SESSION_TTL_MS = 30 * 60 * 1000;

class SessionManager {
  private sessions = new Map<string, ChatSession>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Roda limpeza a cada 5 minutos
    this.cleanupInterval = setInterval(() => this.limparExpiradas(), 5 * 60 * 1000);
  }

  criar(clienteId: string, contexto: ClienteContexto): ChatSession {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      clienteId,
      contexto,
      mensagens: [],
      departamentoAtual: null,
      criadoEm: new Date(),
      ultimaAtividade: new Date(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  buscar(sessionId: string): ChatSession | null {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    // Checa se expirou
    const agora = Date.now();
    if (agora - session.ultimaAtividade.getTime() > SESSION_TTL_MS) {
      this.sessions.delete(sessionId);
      return null;
    }

    session.ultimaAtividade = new Date();
    return session;
  }

  adicionarMensagem(sessionId: string, role: AIChatMessage['role'], content: string): void {
    const session = this.buscar(sessionId);
    if (!session) return;

    session.mensagens.push({ role, content });
    session.ultimaAtividade = new Date();
  }

  atualizarDepartamento(sessionId: string, departamento: string): void {
    const session = this.buscar(sessionId);
    if (!session) return;

    session.departamentoAtual = departamento;
  }

  private limparExpiradas(): void {
    const agora = Date.now();
    let removidas = 0;

    for (const [id, session] of this.sessions) {
      if (agora - session.ultimaAtividade.getTime() > SESSION_TTL_MS) {
        this.sessions.delete(id);
        removidas++;
      }
    }

    if (removidas > 0) {
      logger.info(`Cleaned up ${removidas} expired session(s)`);
    }
  }

  contarAtivas(): number {
    return this.sessions.size;
  }

  destruir(): void {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}

export const sessionManager = new SessionManager();
