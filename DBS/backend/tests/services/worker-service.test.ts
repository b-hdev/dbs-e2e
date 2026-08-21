import { aiService } from '../../src/services/AIService.ts';
import type { ClienteContexto } from '../../src/services/AIService.ts';

async function rodarTesteIA() {
  console.log('🤖 Iniciando teste de classificação da Inteligência Artificial...\n');

  // Simula um cliente com contexto completo vindo do IXC
  const contexto: ClienteContexto = {
    nomeCliente: 'Bruno Santos',
    idClienteIxc: '4521',
    cpfCnpj: '123.456.789-00',
    statusContrato: 'Ativo',
    planoAtual: 'Plano Padrão 500 Mega',
    faturasAbertasCount: 0,
  };

  const mensagemTeste = 'Minha internet caiu, o roteador está com uma luz vermelha acesa e eu preciso trabalhar!';

  try {
    const resultado = await aiService.classificarAtendimento(contexto, mensagemTeste);

    console.log('\n✅ Classificação Concluída com Sucesso!');
    console.log('=========================================');
    console.log('🧠 Departamento:', resultado.departamentoIdentificado);
    console.log('💬 Mensagem gerada:', resultado.mensagemParaCliente);
    console.log('⚙️ Ação no sistema:', resultado.requerAcaoDoSistema);
    console.log('📋 Resumo:', resultado.resumoAtendimento || '(não gerado)');
    console.log('🔺 Prioridade:', resultado.prioridade || '(não definida)');

    if (resultado.toolCall) {
      console.log('🔧 Tool solicitada:', resultado.toolCall.name);
      console.log('   Argumentos:', JSON.stringify(resultado.toolCall.arguments, null, 2));
    } else {
      console.log('🔧 Tool solicitada: nenhuma');
    }

    console.log('=========================================\n');

  } catch (error) {
    console.error('\n❌ Erro no teste da IA:', error);
  }
}

rodarTesteIA();