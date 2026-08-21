import { getClienteByCpfCnpj } from '../../src/services/ixc.services.ts';

async function rodarTeste() {
  console.log('Iniciando teste de conexão com a IXC...');

  const cpfTeste = '941.527.080-26';

  try {
    const cliente = await getClienteByCpfCnpj(cpfTeste);

    if (cliente) {
      console.log('✅ Cliente encontrado!');
      console.log('Nome:', cliente.razao); // 
      console.log('ID do Cliente:', cliente.id);

    } else {
      console.log('⚠️ Nenhum cliente encontrado com esse CPF/CNPJ.');
    }
  } catch (erro) {
    console.error('❌ Deu erro no teste:', erro);
  }
}

rodarTeste();