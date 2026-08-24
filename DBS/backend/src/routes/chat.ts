import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { aiService } from '../services/AIService.ts';
import type { ClienteContexto } from '../services/AIService.ts';
import { sessionManager } from '../services/session-manager.ts';
import { executarTool } from '../services/tool-executor.ts';
import { getClienteByCpfCnpj, getBoletosByClienteId, getContratosCliente } from '../services/ixc-get-client.services.ts';

export async function chatRoute(app: FastifyInstance) {
  app.post(
    '/api/chat',
    {
      schema: {
        body: z.object({
          cpfCnpj: z.string().min(11, 'CPF ou CNPJ deve ter no mínimo 11 caracteres'),
          mensagem: z.string().min(1, 'Mensagem não pode estar vazia'),
          sessionId: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { cpfCnpj, mensagem, sessionId } = request.body as {
        cpfCnpj: string;
        mensagem: string;
        sessionId?: string;
      };

      try {
        let session = sessionId ? sessionManager.buscar(sessionId) : null;

        if (!session) {
          const cliente = await getClienteByCpfCnpj(cpfCnpj);

          if (!cliente) {
            return reply.status(404).send({
              sucesso: false,
              mensagem: 'Cliente não encontrado na base da IXC.',
            });
          }

          const contratos = await getContratosCliente(cliente.id);
          const boletos = await getBoletosByClienteId(cliente.id);

          const contexto: ClienteContexto = {
            nomeCliente: cliente.razao,
            idClienteIxc: cliente.id,
            cpfCnpj: cliente.cnpj_cpf,
            statusContrato: contratos[0]?.status || cliente.status || 'desconhecido',
            planoAtual: contratos[0]?.plano || 'não informado',
            faturasAbertasCount: boletos.length,
          };

          session = sessionManager.criar(cliente.id, contexto);
        }

        sessionManager.adicionarMensagem(session.id, 'user', mensagem);

        const historico = session.mensagens.slice(0, -1);
        const resultado = await aiService.classificarAtendimento(
          session.contexto,
          mensagem,
          historico
        );

        // Execução de tools com validação estrita de sessão contra IDOR
        let toolResult = null;
        if (resultado.toolCall && resultado.requerAcaoDoSistema) {
          toolResult = await executarTool(resultado.toolCall, session.contexto.idClienteIxc);

          if (toolResult.sucesso && toolResult.mensagemFormatada) {
            resultado.mensagemParaCliente += `\n\n${toolResult.mensagemFormatada}`;
          }
        }

        // Atualiza sessão com resposta da IA
        sessionManager.adicionarMensagem(session.id, 'assistant', resultado.mensagemParaCliente);
        sessionManager.atualizarDepartamento(session.id, resultado.departamentoIdentificado);

        // Monta resposta pro mobile
        return reply.status(200).send({
          sucesso: true,
          sessionId: session.id,
          resposta: {
            mensagem: resultado.mensagemParaCliente,
            departamento: resultado.departamentoIdentificado,
            prioridade: resultado.prioridade || 'media',
            resumo: resultado.resumoAtendimento || null,
            requerAcao: resultado.requerAcaoDoSistema,
          },
          toolResult: toolResult
            ? {
              tool: resultado.toolCall?.name,
              sucesso: toolResult.sucesso,
              dados: toolResult.dados || null,
            }
            : null,
          cliente: {
            nome: session.contexto.nomeCliente,
            plano: session.contexto.planoAtual,
            status: session.contexto.statusContrato,
          },
        });

      } catch (error: any) {
        app.log.error(error, 'Error in chat route:');
        return reply.status(500).send({
          sucesso: false,
          mensagem: 'Internal error processing request.',
        });
      }
    }
  );
}
