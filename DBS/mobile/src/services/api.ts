import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL || '';

const getApiBaseUrl = (): string => {
  // DEV: usa a API local na porta 3333
  if (process.env.EXPO_PUBLIC_NODE_ENV === 'dev') {
    if (Platform.OS === 'web') return 'http://localhost:3333';

    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3333`;
      }
    }
    if (Platform.OS === 'android') return 'http://10.0.2.2:3333';
    return 'http://localhost:3333';
  }

  // PROD: usa a URL de produção
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

console.log(`[API Mobile] Conectando ao Backend em: ${API_BASE_URL}`);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Logs para depuração no console do Expo
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API Response Error] ${error.config?.url}:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface IdentifyResponse {
  sucesso: boolean;
  mensagem?: string;
  cliente?: {
    id: string;
    nome: string;
    cpfCnpj: string;
    statusContrato: string;
    planoAtual: string;
    faturasAbertasCount: number;
  };
}

export interface ChatResponse {
  sucesso: boolean;
  sessionId: string;
  resposta: {
    mensagem: string;
    departamento: 'COMERCIAL' | 'SUPORTE' | 'FINANCEIRO' | 'INDEFINIDO';
    prioridade: 'baixa' | 'media' | 'alta';
    resumo: string | null;
    requerAcao: boolean;
  };
  toolResult?: {
    tool?: string;
    sucesso: boolean;
    dados?: any;
  } | null;
  cliente: {
    nome: string;
    plano: string;
    status: string;
  };
}

export const clientService = {
  async identificar(cpfCnpj: string): Promise<IdentifyResponse> {
    const response = await api.post<IdentifyResponse>('/api/identify', { cpfCnpj });
    return response.data;
  },

  async enviarMensagem(payload: {
    cpfCnpj: string;
    mensagem: string;
    sessionId?: string;
  }): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/api/chat', payload);
    return response.data;
  },
};

export default api;
