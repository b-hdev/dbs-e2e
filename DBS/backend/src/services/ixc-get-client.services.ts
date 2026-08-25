import axios from 'axios';
import { env } from '../env/index.ts';
import { Logger } from '../utils/logger.ts';

const logger = new Logger(undefined, 'ixc-service');

// Tipagem dos dados retornados pela API IXC
export interface IXCCliente {
  id: string;
  razao: string;
  cnpj_cpf: string;
  status: string;
  status_internet: string;
  contrato: string;
  plano: string;
  [key: string]: unknown; // campos adicionais dinâmicos da IXC
}

export interface IXCBoleto {
  id: string;
  id_cliente: string;
  data_vencimento: string;
  valor: string;
  status: string;
  linha_digitavel?: string;
  gateway_link?: string;
  nosso_numero?: string;
  [key: string]: unknown;
}

const ixcApi = axios.create({
  baseURL: env.IXC_API_URL,
  timeout: 15000,

  auth: {
    username: env.IXC_API_USER,
    password: env.IXC_API_TOKEN
  },

  headers: {
    'Content-Type': 'application/json',
    'ixcsoft': 'listar'
  }
});


export async function getClienteByCpfCnpj(cpfCnpj: string): Promise<IXCCliente | null> {
  try {
    // Limpa o documento antes de consultar
    const docLimpo = cpfCnpj.trim().replace(/[^A-Za-z0-9.\-\/]/g, '');

    const gridParam = JSON.stringify([
      {
        TB: 'cliente.cnpj_cpf',
        OP: '=',
        P: docLimpo,
      },
    ]);

    const payload = {
      grid_param: gridParam,
    };

    const response = await ixcApi.post('/cliente', payload);

    const clientes = response.data.registros;

    if (!clientes || clientes.length === 0) {
      return null;
    }

    return clientes[0] as IXCCliente;
  } catch (error) {
    logger.error('Error querying client in IXC API', error);
    throw new Error('Failed to communicate with IXC API.');
  }
}

export async function getBoletosByClienteId(clienteId: string): Promise<IXCBoleto[]> {
  try {
    const gridParam = JSON.stringify([
      { TB: 'fn_areceber.id_cliente', OP: '=', P: clienteId },
      { TB: 'fn_areceber.status', OP: '=', P: 'A' }
    ]);

    const payload = { grid_param: gridParam };

    const response = await ixcApi.post('/fn_areceber', payload);

    return (response.data.registros || []) as IXCBoleto[];
  } catch (error) {
    logger.error('Error fetching invoices in IXC API', error);
    throw new Error('Failed to communicate with billing system.');
  }
}

export async function getContratosCliente(clienteId: string) {
  try {
    const gridParam = JSON.stringify([
      { TB: 'cliente_contrato.id_cliente', OP: '=', P: clienteId },
      { TB: 'cliente_contrato.status', OP: '=', P: 'A' }
    ]);

    const payload = { grid_param: gridParam };

    const response = await ixcApi.post('/cliente_contrato', payload);

    return response.data.registros || [];
  } catch (error) {
    logger.error('Error fetching contracts in IXC API', error);
    return [];
  }
}