import { aiService } from '../../src/services/AIService.ts';
import type { ClienteContexto } from '../../src/services/AIService.ts';

async function rodarTesteIA() {
  console.log('Iniciando teste de integracao do servico de atendimento...\n');

  const contexto: ClienteContexto = {
    nomeCliente: 'Bruno Santos',
    idClienteIxc: '4521',
    cpfCnpj: '123.456.789-00',
    statusContrato: 'Ativo',
    planoAtual: 'Plano 500 Mega',
    faturasAbertasCount: 0,
  };

  const mensagemTeste = 'Minha internet caiu, o roteador esta com luz vermelha acesa.';

  try {
    const resultado = await aiService.classificarAtendimento(contexto, mensagemTeste);

    console.log('Classificacao concluida:');
    console.log('- Departamento:', resultado.departamentoIdentificado);
    console.log('- Resposta:', resultado.mensagemParaCliente);
    console.log('- Requer acao:', resultado.requerAcaoDoSistema);
    console.log('- Prioridade:', resultado.prioridade);

    if (resultado.toolCall) {
      console.log('- Tool:', resultado.toolCall.name);
      console.log('  Args:', resultado.toolCall.arguments);
    }
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

rodarTesteIA();