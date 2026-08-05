export const COMMISSION = {
  DOCTOR_RATE: 10,
  PHARMACY_RATE: 5,
} as const;

export function calculateCommission(amount: number, rate: number): number {
  return Math.round((amount * rate) / 100);
}

export function calculateNetEarnings(amount: number, rate: number): number {
  return amount - calculateCommission(amount, rate);
}
