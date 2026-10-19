export type BudgetTone = "neutral" | "warning" | "positive" | "danger";

export type BudgetStatus = {
  label: string;
  tone: BudgetTone;
  ratio: number;
  percentage: number;
};

export function getBudgetStatus(spent: number, budget: number): BudgetStatus {
  if (budget <= 0) {
    return {
      label: spent > 0 ? "Over budget" : "No budget set",
      tone: spent > 0 ? "danger" : "neutral",
      ratio: spent > 0 ? 1 : 0,
      percentage: 0,
    };
  }

  const ratio = spent / budget;
  const currencyTolerance = 0.005;
  if (spent > budget + currencyTolerance) return { label: "Over budget", tone: "danger", ratio, percentage: Math.round(ratio * 100) };
  if (spent >= budget - currencyTolerance) return { label: "On target", tone: "positive", ratio, percentage: 100 };
  if (ratio >= 0.8) return { label: "Approaching limit", tone: "warning", ratio, percentage: Math.round(ratio * 100) };
  return { label: "On track", tone: "neutral", ratio, percentage: Math.round(ratio * 100) };
}
