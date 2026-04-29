/**
 * Mask a value with '*' if the user doesn't have permission to see it.
 * @param value The value to display (number or string)
 * @param canSeeValues Boolean indicating if the user has permission to see values
 * @returns The original value formatted or '*'
 */
export const maskValue = (value: any, canSeeValues: boolean = true) => {
  if (canSeeValues) return value;
  return '*';
};

/**
 * Specifically for currency/number formatting but with masking support.
 */
export const formatCurrency = (value: number, canSeeValues: boolean = true) => {
  if (!canSeeValues) return '*';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatNumber = (value: number, canSeeValues: boolean = true) => {
  if (!canSeeValues) return '*';
  return new Intl.NumberFormat('pt-BR').format(value);
};
