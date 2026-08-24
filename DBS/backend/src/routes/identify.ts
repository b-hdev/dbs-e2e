import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  getClienteByCpfCnpj,
  getContratosCliente,
  getBoletosByClienteId,
} from '../services/ixc-get-client.services.ts';

export interface IIdentificar {
  cpfCnpj: string;
}

export async function identifyRoute(app: FastifyInstance) {
  app.post(
    '/api/identify',
    {
      schema: {
        body: z.object({
          cpfCnpj: z.string().min(11, 'O CPF ou CNPJ deve ter no mínimo 11 caracteres'),
        }),
      },
    },
    async (request, reply) => {
      const { cpfCnpj } = request.body as IIdentificar;

      try {
        const cliente = await getClienteByCpfCnpj(cpfCnpj);

        if (!cliente) {
          return reply.status(404).send({
            sucesso: false,
            mensagem: 'Cliente não encontrado na base da IXC.',
          });
        }

        const [contratos, boletos] = await Promise.all([
          getContratosCliente(cliente.id),
          getBoletosByClienteId(cliente.id),
        ]);

        const contratoPrincipal = contratos[0];

        return reply.status(200).send({
          sucesso: true,
          cliente: {
            id: cliente.id,
            nome: cliente.razao,
            cpfCnpj: cliente.cnpj_cpf,
            statusContrato: contratoPrincipal?.status || cliente.status || 'Ativo',
            planoAtual: contratoPrincipal?.plano || 'Plano Fibra Padrão',
            faturasAbertasCount: boletos.length,
          },
        });
      } catch (error) {
        app.log.error(error, 'Error in identify route:');
        return reply.status(500).send({
          sucesso: false,
          mensagem: 'Internal error querying IXC server.',
        });
      }
    }
  );
}