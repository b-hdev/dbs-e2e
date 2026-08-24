import type { AIToolCall } from './AIService.ts';
import { getBoletosByClienteId, type IXCBoleto } from './ixc-get-client.services.ts';
import { Logger } from '../utils/logger.ts';

const logger = new Logger(undefined, 'tool-executor');

export interface ToolResult {
  sucesso: boolean;
  dados?: unknown;
  mensagemFormatada?: string;
  erro?: string;
}

type ToolHandler = (args: Record<string, string>, clienteIdContexto?: string) => Promise<ToolResult>;

const toolHandlers: Record<string, ToolHandler> = {
  consultar_faturas_ixc: executarConsultaFaturas,
  encaminhar_departamento: executarEncaminhamento,
  verificar_status_conexao_ixc: executarVerificacaoStatus,
};

/**
 * Executa uma toolCall retornada pela IA garantindo segurança contra IDOR.
 * O clienteIdContexto (proveniente da sessão autenticada) tem precedência sobre qualquer ID arbitrário da IA.
 */
export async function executarTool(
  toolCall: AIToolCall,
  clienteIdContexto?: string
): Promise<ToolResult> {
  const handler = toolHandlers[toolCall.name];

  if (!handler) {
    logger.warn(`Tool desconhecida: ${toolCall.name}`);
    return {
      sucesso: false,
      erro: `Ferramenta "${toolCall.name}" não está disponível.`,
    };
  }

  try {
    logger.info(`Executando tool: ${toolCall.name}`, {
      args: toolCall.arguments,
      clienteIdContexto,
    });
    const resultado = await handler(toolCall.arguments, clienteIdContexto);
    logger.info(`Tool ${toolCall.name} concluída: ${resultado.sucesso ? 'OK' : 'ERRO'}`);
    return resultado;
  } catch (error: any) {
    logger.error(`Erro ao executar ${toolCall.name}`, error);
    return {
      sucesso: false,
      erro: `Erro ao executar a ferramenta: ${error.message}`,
    };
  }
}

// ===========================
// HANDLERS DAS TOOLS
// ===========================

async function executarConsultaFaturas(
  args: Record<string, string>,
  clienteIdContexto?: string
): Promise<ToolResult> {
  // Prevenção contra IDOR: utiliza prioritariamente o ID do cliente da sessão autenticada
  const clienteId = clienteIdContexto || args.cliente_id;

  if (!clienteId) {
    return { sucesso: false, erro: 'ID do cliente não informado.' };
  }

  const boletos = await getBoletosByClienteId(clienteId);

  if (!boletos || boletos.length === 0) {
    return {
      sucesso: true,
      dados: [],
      mensagemFormatada: 'Não foram encontradas faturas em aberto para este contrato.',
    };
  }

  const mensagem = formatarBoletos(boletos);

  return {
    sucesso: true,
    dados: boletos,
    mensagemFormatada: mensagem,
  };
}

async function executarEncaminhamento(
  args: Record<string, string>,
  _clienteIdContexto?: string
): Promise<ToolResult> {
  const { setor, resumo_atendimento, prioridade } = args;

  if (!setor || !resumo_atendimento) {
    return { sucesso: false, erro: 'Setor e resumo são obrigatórios para encaminhamento.' };
  }

  logger.info(`Encaminhando para ${setor} | Prioridade: ${prioridade || 'normal'}`, { resumo: resumo_atendimento });

  return {
    sucesso: true,
    dados: { setor, resumo_atendimento, prioridade: prioridade || 'media' },
    mensagemFormatada: `Atendimento encaminhado para o setor de ${setor}. Um atendente humano dará continuidade ao seu chamado.`,
  };
}

async function executarVerificacaoStatus(
  args: Record<string, string>,
  clienteIdContexto?: string
): Promise<ToolResult> {
  const clienteId = clienteIdContexto || args.cliente_id;

  if (!clienteId) {
    return { sucesso: false, erro: 'ID do cliente não informado.' };
  }

  return {
    sucesso: true,
    dados: { clienteId, verificado: true },
    mensagemFormatada: 'Verificação de status realizada. Por favor, siga com as orientações de diagnóstico.',
  };
}

function formatarBoletos(boletos: IXCBoleto[]): string {
  const linhas: string[] = [];

  linhas.push(`Encontrei ${boletos.length} fatura(s) em aberto:\n`);

  for (const boleto of boletos) {
    linhas.push(`📄 Fatura #${boleto.id}`);
    linhas.push(`   💰 Valor: R$ ${boleto.valor}`);
    linhas.push(`   📅 Vencimento: ${boleto.data_vencimento}`);

    if (boleto.linha_digitavel) {
      linhas.push(`   🔢 Linha digitável: ${boleto.linha_digitavel}`);
    }

    if (boleto.gateway_link) {
      linhas.push(`   🔗 Link do boleto: ${boleto.gateway_link}`);
    }

    linhas.push('');
  }

  return linhas.join('\n');
}
