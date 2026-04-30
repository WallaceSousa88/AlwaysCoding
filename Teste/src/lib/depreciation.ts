export const calculateDepreciation = (purchaseValue: number | string, purchaseDate: string, disposalDate: string, type: string, percentage: number | string) => {
  const val = typeof purchaseValue === 'string' ? parseFloat(purchaseValue.replace(',', '.')) : Number(purchaseValue);
  const pct = typeof percentage === 'string' ? parseFloat(percentage.replace(',', '.')) : Number(percentage);

  if (isNaN(val) || isNaN(pct) || !purchaseDate || !disposalDate) return isNaN(val) ? 0 : val;

  const start = new Date(purchaseDate);
  const end = new Date(disposalDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return val;

  const diffTime = Math.max(0, end.getTime() - start.getTime());
  
  let periods = 0;
  if (type === 'DIARIA') {
    periods = diffTime / (1000 * 60 * 60 * 24);
  } else if (type === 'MENSAL') {
    periods = diffTime / (1000 * 60 * 60 * 24 * 30.44);
  } else if (type === 'ANUAL') {
    periods = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  }

  const totalDepreciation = (val * (pct / 100)) * periods;
  return Math.max(0, val - totalDepreciation);
};
