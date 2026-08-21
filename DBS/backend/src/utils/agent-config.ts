import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// -- Tipagens do JSON de configuração do agente --

export interface WorkflowStep {
  passo: number;
  nome: string;
  instrucao: string;
  objetivo?: string;
  regra_especial?: string;
  desvios?: Record<string, string>;
  regras_oferta?: Array<{
    condicao: string;
    plano_recomendado: string;
    valor_mensal?: number;
    valor_cheio?: number;
    valor_com_pontualidade?: number;
    argumento: string;
  }>;
  matriz_objecoes?: Record<string, string>;
  regras_horario?: Record<string, string>;
}

export interface WorkflowAcao {
  gatilho: string;
  execucao: string;
  formato_resposta?: string;
}

export interface Workflow {
  departamento: string;
  descricao: string;
  obrigatorio_antes_de_transferir?: boolean;
  etapas_ordenadas?: WorkflowStep[];
  acoes?: WorkflowAcao[];
}

export interface ToolParameter {
  type: string;
  properties: Record<string, { type: string; description?: string; enum?: string[] }>;
  required: string[];
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: ToolParameter;
}

export interface FewShotExample {
  intent: string;
  user_message: string;
  assistant_response?: string;
  tool_call?: {
    name: string;
    arguments: Record<string, string>;
  };
}

export interface AgentConfig {
  agent_metadata: {
    name: string;
    version: string;
    description: string;
    company: string;
  };
  context_variables_schema: Record<string, string>;
  system_prompt_template: string;
  workflows: Record<string, Workflow>;
  tools_schema: ToolSchema[];
  few_shot_examples: FewShotExample[];
}

// Carrega o arquivo JSON uma vez só na inicialização
const __dirname = dirname(fileURLToPath(import.meta.url));
const caminhoConfig = resolve(__dirname, 'dbs_telecom_agent_config.json');
const conteudo = readFileSync(caminhoConfig, 'utf-8');

export const agentConfig: AgentConfig = JSON.parse(conteudo);
