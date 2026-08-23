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
      logger.info(`Iniciando classificação para o cliente: ${contexto.nomeCliente}`);

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

      if (!conteudoBruto) {
        logger.error('Resposta da Cloudflare veio vazia', response.data);
        throw new Error('A API retornou um resultado vazio.');
      }

      const resultado = this.parseJSONResponse<AIClassificationResponse>(conteudoBruto);

      logger.info(`Classificação concluída: ${resultado.departamentoIdentificado}`);
      return resultado;

    } catch (error: any) {
      logger.error('Erro na classificação da IA', error?.response?.data || error);
      throw new Error('Falha ao processar o atendimento com a Inteligência Artificial.');
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

  private parseJSONResponse<T>(raw: any): T {
    if (typeof raw === 'object' && raw !== null) {
      if ('mensagemParaCliente' in raw || 'departamentoIdentificado' in raw) {
        return raw as T;
      }
      if (raw.response) {
        return this.parseJSONResponse<T>(raw.response);
      }
      if (raw.result) {
        return this.parseJSONResponse<T>(raw.result);
      }
      return raw as T;
    }

    if (typeof raw !== 'string') {
      raw = String(raw || '');
    }

    let clean = raw.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim();
    clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();

    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('Nenhum objeto JSON encontrado na resposta');
    }

    let jsonStr = clean.substring(firstBrace, lastBrace + 1);
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

    return JSON.parse(jsonStr) as T;
  }
}

export const aiService = new AIService();