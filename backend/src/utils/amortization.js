import { computeMonthlyPayment } from "./simulation.js";

export function buildAmortizationSchedule(principal, annualRatePercent, durationMonths) {
  const n = Math.max(1, durationMonths);
  const r = annualRatePercent / 100 / 12;
  const payment = computeMonthlyPayment(principal, annualRatePercent, n);
  let balance = principal;
  const rows = [];
  for (let month = 1; month <= n; month++) {
    const interest = r === 0 ? 0 : balance * r;
    const principalPart = Math.min(balance, payment - interest);
    const newBalance = Math.max(0, balance - principalPart);
    rows.push({
      month,
      payment: Math.round(payment * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      principal: Math.round(principalPart * 100) / 100,
      balance: Math.round(newBalance * 100) / 100,
    });
    balance = newBalance;
  }
  return { monthlyPayment: Math.round(payment * 100) / 100, rows };
}
