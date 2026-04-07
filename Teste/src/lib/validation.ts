export const validateEmail = (email: string) => {
  if (!email) return true; // Optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateCPF = (cpf: string) => {
  if (!cpf) return true; // Optional field
  const numbers = cpf.replace(/\D/g, '');
  return numbers.length === 11;
};

export const validateCNPJ = (cnpj: string) => {
  if (!cnpj) return true; // Optional field
  const numbers = cnpj.replace(/\D/g, '');
  return numbers.length === 14;
};

export const validatePhone = (phone: string) => {
  if (!phone) return true; // Optional field
  const numbers = phone.replace(/\D/g, '');
  return numbers.length >= 10 && numbers.length <= 11;
};

export const validateCEP = (cep: string) => {
  if (!cep) return true; // Optional field
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
};
