export const formatPrice = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined || amount === 0) return "0,00 kr";
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace(/\s/g, ' ') + ' kr';
};

export const formatRevenue = (amount: number | null | undefined) => {
  return formatPrice(amount);
};