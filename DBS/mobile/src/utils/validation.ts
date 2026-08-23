export function isValidCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) return false;

  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i), 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(9, 10), 10)) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i), 10) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(10, 11), 10)) return false;

  return true;
}

export function isValidCNPJ(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  if (cleanCnpj.length !== 14) return false;
  if (/^([A-Z0-9])\1{13}$/.test(cleanCnpj)) return false;
  if (!/^\d{2}$/.test(cleanCnpj.substring(12, 14))) return false;

  const getCharValue = (char: string): number => {
    return char.charCodeAt(0) - 48;
  };

  // 1º Dígito Verificador
  const pesosD1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma1 = 0;
  for (let i = 0; i < 12; i++) {
    soma1 += getCharValue(cleanCnpj[i]) * pesosD1[i];
  }

  const resto1 = soma1 % 11;
  const digito1 = resto1 < 2 ? 0 : 11 - resto1;

  if (digito1 !== parseInt(cleanCnpj[12], 10)) {
    return false;
  }

  // 2º Dígito Verificador
  const pesosD2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma2 = 0;
  for (let i = 0; i < 12; i++) {
    soma2 += getCharValue(cleanCnpj[i]) * pesosD2[i];
  }
  // Inclui o 1º dígito verificador calculado
  soma2 += digito1 * pesosD2[12];

  const resto2 = soma2 % 11;
  const digito2 = resto2 < 2 ? 0 : 11 - resto2;

  if (digito2 !== parseInt(cleanCnpj[13], 10)) {
    return false;
  }

  return true;
}

export const formatCpfCnpj = (value: string): string => {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  if (/^\d+$/.test(cleaned) && cleaned.length <= 11) {
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  }

  return cleaned
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, '$1.$2')
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, '$1.$2.$3')
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, '.$1/$2')
    .replace(/([A-Z0-9]{4})([A-Z0-9])/, '$1-$2')
    .substring(0, 18);
};

export const cleanCpfCnpj = (value: string): string => {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
};
