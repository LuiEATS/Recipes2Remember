export function normalizeUnit(amount, unit) {
  const u = unit?.toLowerCase() || '';
  if (u === 'tbsp') return { amount: amount / 16, unit: 'cup' };
  if (u === 'tsp')  return { amount: amount / 48, unit: 'cup' };
  return { amount, unit: u };
}

export function formatAmount(amount) {
  if (!amount) return '0';
  if (amount === Math.floor(amount)) return amount.toString();
  const frac = { 0.25:'1/4', 0.5:'1/2', 0.75:'3/4', 0.333:'1/3', 0.667:'2/3', 0.125:'1/8' };
  const whole = Math.floor(amount);
  const rem = +(amount - whole).toFixed(3);
  const f = frac[rem] || rem.toFixed(2);
  return whole > 0 ? `${whole} ${f}` : f;
}
