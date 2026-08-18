import axios from 'axios';
import { env } from '../../env/index.ts';

const ixcApi = axios.create({
  baseURL: env.IXC_API_URL,

  auth: {
    username: env.IXC_API_USER,
    password: env.IXC_API_TOKEN
  },

  headers: {
    'Content-Type': 'application/json',
    'ixcsoft': 'listar'
  }
});


export async function getClienteByCpfCnpj(cpfCnpj: string) {
  try {
    const gridParam = JSON.stringify([
      {
        TB: 'cliente.cnpj_cpf',
        OP: '=',
        P: cpfCnpj
      }
    ]);


    const payload = {
      grid_param: gridParam
    };

    const response = await ixcApi.post('/cliente', payload);

    const clientes = response.data.registros;

    if (!clientes || clientes.length === 0) {
      return null;
    }

    return clientes[0];

  } catch (error) {
    console.error('❌ Erro ao consultar cliente na IXC:', error);
    throw new Error('Falha na comunicação com a API da IXC.');
  }
}

export async function getBoletosByClienteId(clienteId: string) {
  try {
    const gridParam = JSON.stringify([
      { TB: 'fn_areceber.id_cliente', OP: '=', P: clienteId },
      { TB: 'fn_areceber.status', OP: '=', P: 'A' }
    ]);

    const payload = { grid_param: gridParam };

    const response = await ixcApi.post('/fn_areceber', payload);

    return response.data.registros || [];
  } catch (error) {
    console.error('❌ Erro ao buscar boletos na IXC:', error);
    throw new Error('Falha na comunicação com o sistema financeiro.');
  }
}