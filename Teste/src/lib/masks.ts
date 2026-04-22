export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
};

export const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

export const maskCurrency = (value: string) => {
  // Remove everything except numbers and comma
  let cleanValue = value.replace(/[^\d,]/g, '');
  
  // Ensure only one comma
  const parts = cleanValue.split(',');
  if (parts.length > 2) {
    cleanValue = parts[0] + ',' + parts.slice(1).join('');
  }
  
  const commaIndex = cleanValue.indexOf(',');
  let integerPart = commaIndex !== -1 ? cleanValue.slice(0, commaIndex) : cleanValue;
  const decimalPart = commaIndex !== -1 ? cleanValue.slice(commaIndex + 1) : null;
  
  // Remove leading zeros from integer part
  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+/, '');
    if (integerPart === '') integerPart = '0';
  }
  if (integerPart === '') return decimalPart !== null ? `0,${decimalPart}` : '';

  // Format integer part with dots
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return decimalPart !== null ? `${formattedInteger},${decimalPart.slice(0, 2)}` : formattedInteger;
};

export const parseCurrency = (value: string) => {
  if (!value) return 0;
  // Remove dots and convert comma to dot for parsing
  const clean = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};
