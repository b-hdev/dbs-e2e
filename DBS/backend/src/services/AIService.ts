import axios from 'axios';
import { env } from '../env/index.ts';
import { agentConfig } from '../utils/agent-config.ts';
import type { Workflow, WorkflowStep, FewShotExample, ToolSchema } from '../utils/agent-config.ts';
import { Logger } from '../utils/logger.ts';

const logger = new Logger(undefined, 'ai-service');

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIToolCall {
  name: string;
  arguments: Record<string, string>;
}

// Contexto do cliente pra preencher o template do prompt
export interface ClienteContexto {
  nomeCliente: string;
  idClienteIxc?: string;
  cpfCnpj?: string;
  statusContrato?: string;
  planoAtual?: string;
  faturasAbertasCount?: number;
}

export interface AIClassificationResponse {
  mensagemParaCliente: string;
  departamentoIdentificado: 'COMERCIAL' | 'SUPORTE' | 'FINANCEIRO' | 'INDEFINIDO';
  requerAcaoDoSistema: boolean;
  toolCall?: AIToolCall;
  resumoAtendimento?: string;
  prioridade?: 'baixa' | 'media' | 'alta';
}

export class AIService {
  private apiUrl = `${env.AI_URL_WORKER}`;
  private config = agentConfig;

  async classificarAtendimento(
    contexto: ClienteContexto,
    mensagem: string,
    historico: AIChatMessage[] = []
  ): Promise<AIClassificationResponse> {

    const promptSistema = this.montarPromptSistema(contexto);

    // Monta a lista de mensagens: system prompt + histórico anterior + mensagem atual
    const messages: AIChatMessage[] = [
      { role: 'system', content: promptSistema },
      ...historico,
      { role: 'user', content: `Nome do cliente: ${contexto.nomeCliente}. Mensagem: "${mensagem}"` }
    ];

    try {
      logger.info(`Starting classification for client: ${contexto.nomeCliente}`);

      const response = await axios.post(
        this.apiUrl,
        { messages },
        {
          headers: {
            'Authorization': `Bearer ${env.AI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const conteudoBruto =
        response.data?.result?.response ??
        response.data?.result ??
        response.data?.response ??
        response.data;

      const fallbackText = `Olá, ${contexto.nomeCliente}! Sou o assistente virtual da DBS TELECOM. Como posso te auxiliar hoje?\n\n1. ⚡ Suporte Técnico (instabilidade ou lentidão)\n2. 📄 Financeiro (2ª via de boleto ou Pix)\n3. 🚀 Comercial (planos de internet)`;

      const resultado = this.parseJSONResponse(conteudoBruto, {
        mensagemParaCliente: fallbackText,
      });

      if (!resultado.mensagemParaCliente || !resultado.mensagemParaCliente.trim()) {
        resultado.mensagemParaCliente = fallbackText;
      }

      logger.info(`Classification completed: ${resultado.departamentoIdentificado}`);
      return resultado;

    } catch (error: any) {
      logger.error('AI classification error, falling back to INDEFINIDO', error?.response?.data || error);

      return {
        mensagemParaCliente: `Olá, ${contexto.nomeCliente}! Sou o assistente virtual da DBS TELECOM. Como posso te auxiliar hoje?\n\n1. ⚡ Suporte Técnico (instabilidade ou lentidão)\n2. 📄 Financeiro (2ª via de boleto ou Pix)\n3. 🚀 Comercial (planos de internet)`,
        departamentoIdentificado: 'INDEFINIDO',
        requerAcaoDoSistema: false,
        prioridade: 'media',
        resumoAtendimento: 'Triagem inicial (modo de contingência)',
      };
    }
  }

  private montarPromptSistema(contexto: ClienteContexto): string {
    const partes: string[] = [];

    let template = this.config.system_prompt_template;
    template = template.replace(/\{\{nome_cliente\}\}/g, contexto.nomeCliente);
    template = template.replace(/\{\{id_cliente_ixc\}\}/g, contexto.idClienteIxc || 'não identificado');
    template = template.replace(/\{\{cpf_cnpj\}\}/g, contexto.cpfCnpj || 'não informado');
    template = template.replace(/\{\{status_contrato\}\}/g, contexto.statusContrato || 'desconhecido');
    template = template.replace(/\{\{plano_atual\}\}/g, contexto.planoAtual || 'não informado');
    template = template.replace(/\{\{faturas_abertas_count\}\}/g, String(contexto.faturasAbertasCount ?? 0));
    partes.push(template);

    partes.push('\n--- WORKFLOWS DE ATENDIMENTO ---');
    for (const [chave, workflow] of Object.entries(this.config.workflows)) {
      partes.push(this.formatarWorkflow(chave, workflow));
    }

    partes.push('\n--- FERRAMENTAS DISPONÍVEIS ---');
    partes.push(this.formatarTools(this.config.tools_schema));

    partes.push('\n--- EXEMPLOS DE CONVERSA ---');
    partes.push(this.formatarExemplos(this.config.few_shot_examples));

    partes.push(this.gerarInstrucaoFormatoResposta());

    return partes.join('\n');
  }

  private formatarWorkflow(chave: string, workflow: Workflow): string {
    const linhas: string[] = [];
    linhas.push(`\n[${workflow.departamento.toUpperCase()}] ${workflow.descricao}`);

    if (workflow.obrigatorio_antes_de_transferir) {
      linhas.push('⚠ OBRIGATÓRIO executar todas as etapas antes de transferir para atendente humano.');
    }

    // Workflows com etapas sequenciais (suporte e comercial)
    if (workflow.etapas_ordenadas) {
      for (const etapa of workflow.etapas_ordenadas) {
        linhas.push(this.formatarEtapa(etapa));
      }
    }

    // Workflows baseados em ações/gatilhos (financeiro)
    if (workflow.acoes) {
      for (const acao of workflow.acoes) {
        linhas.push(`  • Gatilho: ${acao.gatilho}`);
        linhas.push(`    Ação: ${acao.execucao}`);
        if (acao.formato_resposta) {
          linhas.push(`    Formato: ${acao.formato_resposta}`);
        }
      }
    }

    return linhas.join('\n');
  }

  private formatarEtapa(etapa: WorkflowStep): string {
    const linhas: string[] = [];
    linhas.push(`  Passo ${etapa.passo} (${etapa.nome}): ${etapa.instrucao}`);

    if (etapa.objetivo) {
      linhas.push(`    Objetivo: ${etapa.objetivo}`);
    }
    if (etapa.regra_especial) {
      linhas.push(`    ⚠ Regra especial: ${etapa.regra_especial}`);
    }
    if (etapa.desvios) {
      for (const [caso, acao] of Object.entries(etapa.desvios)) {
        linhas.push(`    → Se ${caso}: ${acao}`);
      }
    }
    if (etapa.regras_oferta) {
      for (const oferta of etapa.regras_oferta) {
        const valor = oferta.valor_mensal
          ? `R$ ${oferta.valor_mensal}`
          : `R$ ${oferta.valor_cheio} (pontualidade: R$ ${oferta.valor_com_pontualidade})`;
        linhas.push(`    • ${oferta.condicao} → ${oferta.plano_recomendado} — ${valor}`);
        linhas.push(`      Argumento: ${oferta.argumento}`);
      }
    }
    if (etapa.matriz_objecoes) {
      linhas.push('    Contorno de objeções:');
      for (const [objecao, resposta] of Object.entries(etapa.matriz_objecoes)) {
        linhas.push(`      "${objecao}": ${resposta}`);
      }
    }
    if (etapa.regras_horario) {
      for (const [periodo, regra] of Object.entries(etapa.regras_horario)) {
        linhas.push(`    • ${periodo}: ${regra}`);
      }
    }

    return linhas.join('\n');
  }

  private formatarTools(tools: ToolSchema[]): string {
    const linhas: string[] = [];

    for (const tool of tools) {
      linhas.push(`\n• ${tool.name}: ${tool.description}`);
      linhas.push(`  Parâmetros: ${JSON.stringify(tool.parameters.properties)}`);
      linhas.push(`  Obrigatórios: ${tool.parameters.required.join(', ')}`);
    }

    return linhas.join('\n');
  }

  private formatarExemplos(exemplos: FewShotExample[]): string {
    const linhas: string[] = [];

    for (const ex of exemplos) {
      linhas.push(`\n[Exemplo: ${ex.intent}]`);
      linhas.push(`Cliente: "${ex.user_message}"`);
      if (ex.assistant_response) {
        linhas.push(`Assistente: "${ex.assistant_response}"`);
      }
      if (ex.tool_call) {
        linhas.push(`Tool chamada: ${ex.tool_call.name}(${JSON.stringify(ex.tool_call.arguments)})`);
      }
    }

    return linhas.join('\n');
  }

  private gerarInstrucaoFormatoResposta(): string {
    return `
--- FORMATO DE RESPOSTA ---
Responda APENAS com um objeto JSON válido, sem formatação markdown, seguindo exatamente este formato:
{
  "mensagemParaCliente": "sua resposta ao cliente aqui",
  "departamentoIdentificado": "SUPORTE",
  "requerAcaoDoSistema": false,
  "toolCall": null,
  "resumoAtendimento": "breve resumo do que foi tratado",
  "prioridade": "media"
}

Regras do JSON:
- departamentoIdentificado: sempre "COMERCIAL", "SUPORTE", "FINANCEIRO" ou "INDEFINIDO"
- toolCall: null se não precisar chamar nenhuma ferramenta, ou {"name": "nome_da_tool", "arguments": {...}} se precisar
- prioridade: "baixa", "media" ou "alta"
- resumoAtendimento: resumo curto do que foi identificado e orientado
- requerAcaoDoSistema: true se a toolCall precisa ser executada pelo backend`;
  }

  private parseJSONResponse(raw: any, fallback?: Partial<AIClassificationResponse>): AIClassificationResponse {
    try {
      if (typeof raw === 'object' && raw !== null) {
        if ('mensagemParaCliente' in raw || 'departamentoIdentificado' in raw) {
          return {
            mensagemParaCliente: raw.mensagemParaCliente || raw.mensagem || '',
            departamentoIdentificado: raw.departamentoIdentificado || 'INDEFINIDO',
            requerAcaoDoSistema: Boolean(raw.requerAcaoDoSistema),
            toolCall: raw.toolCall || undefined,
            resumoAtendimento: raw.resumoAtendimento,
            prioridade: raw.prioridade || 'media',
          };
        }
        if (raw.response) {
          return this.parseJSONResponse(raw.response, fallback);
        }
        if (raw.result) {
          return this.parseJSONResponse(raw.result, fallback);
        }
      }

      if (typeof raw !== 'string') {
        raw = String(raw || '');
      }

      let clean = raw.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
      clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();

      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace > firstBrace) {
        let jsonStr = clean.substring(firstBrace, lastBrace + 1);
        jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
        const parsed = JSON.parse(jsonStr);

        return {
          mensagemParaCliente: parsed.mensagemParaCliente || parsed.mensagem || clean.substring(0, firstBrace).trim() || '',
          departamentoIdentificado: parsed.departamentoIdentificado || 'INDEFINIDO',
          requerAcaoDoSistema: Boolean(parsed.requerAcaoDoSistema),
          toolCall: parsed.toolCall || undefined,
          resumoAtendimento: parsed.resumoAtendimento,
          prioridade: parsed.prioridade || 'media',
        };
      }

      if (clean.length > 0) {
        return {
          mensagemParaCliente: clean,
          departamentoIdentificado: 'INDEFINIDO',
          requerAcaoDoSistema: false,
          prioridade: 'media',
          resumoAtendimento: 'Triagem em andamento',
        };
      }
    } catch (parseErr) {
      logger.warn('Failed to parse AI JSON response, falling back to INDEFINIDO', parseErr);
    }

    return {
      mensagemParaCliente: fallback?.mensagemParaCliente || 'Como posso te ajudar hoje? Posso auxiliar com Suporte Técnico, 2ª via de Fatura ou Planos de Internet.',
      departamentoIdentificado: 'INDEFINIDO',
      requerAcaoDoSistema: false,
      prioridade: 'media',
      resumoAtendimento: 'Triagem inicial',
    };
  }
}

export const aiService = new AIService();