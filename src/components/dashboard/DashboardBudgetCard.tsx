import type { BudgetStatus } from "../../lib/budget";
import type { Budget, Expense } from "../../types/retain";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type DashboardBudgetCardProps = {
  budget: Budget;
  total: number;
  remaining: number;
  highest: Expense | null;
  status: BudgetStatus;
  barColor: string;
  loading: boolean;
  summaryError: string | null;
  budgetError: string | null;
  onRetrySummary: () => void;
  onRetryBudget: () => void;
};

export default function DashboardBudgetCard({ budget, total, remaining, highest, status, barColor, loading, summaryError, budgetError, onRetrySummary, onRetryBudget }: DashboardBudgetCardProps) {
  return <div className="panel budget-panel budget-panel--overview">
    <div className="budget-overview__top"><p className="budget-overview__label">Spent this month</p><Link className="button button--quiet" to="/budgets">Manage budget <Icon name="arrow" size={14} /></Link></div>
    <div className="budget-overview__meter"><div className="budget-figure"><strong>{money.format(total)}</strong><span>of {money.format(budget.amount)}</span></div><div className="progress-track"><span style={{ background: barColor, width: `${budget.amount ? Math.min(status.ratio * 100, 100) : 0}%` }} /></div><div className="budget-meta"><span>{budget.amount ? `${status.percentage}% of budget used` : "Set a budget to track progress"}</span><span className={`budget-status budget-status--${status.tone}`}><span className="budget-status__dot" />{status.label}</span></div></div>
    <div className="budget-support-grid"><div className="budget-support-stat"><span>Remaining</span><strong>{money.format(remaining)}</strong><small>available this month</small></div><div className="budget-support-stat"><span>Largest expense</span><strong>{money.format(highest?.amount ?? 0)}</strong><small>{highest ? `${highest.title} · ${highest.category.name}` : "No expenses yet"}</small></div></div>
    {loading && <span className="budget-refreshing"><span className="loading-orb" />Refreshing activity</span>}
    {summaryError && <div className="inline-error" role="alert"><span>{summaryError}</span><button className="text-link" onClick={onRetrySummary} type="button">Try again</button></div>}
    {budgetError && <div className="inline-error" role="alert"><span>{budgetError}</span><button className="text-link" onClick={onRetryBudget} type="button">Try again</button></div>}
  </div>;
}
