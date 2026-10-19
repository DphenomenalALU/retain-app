import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchExpenseSummary } from "../store/slices/expensesSlice";
import { fetchBudget } from "../store/slices/budgetSlice";
import type { Expense } from "../types/retain";
import { Icon } from "../components/ui/Icon";
import MonthPicker from "../components/ui/MonthPicker";
import ExpenseDetailDrawer from "../components/expenses/ExpenseDetailDrawer";
import DashboardBudgetCard from "../components/dashboard/DashboardBudgetCard";
import CategoryBreakdown from "../components/dashboard/CategoryBreakdown";
import RecentExpenses from "../components/dashboard/RecentExpenses";
import { currentMonth } from "../lib/date";
import { getBudgetStatus } from "../lib/budget";

const monthLabel = (month: string) => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
const greeting = () => { const hour = new Date().getHours(); return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; };

export default function DashboardPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { summary, summaryLoading: loading, summaryError } = useAppSelector((state) => state.expenses);
  const { current: budget, error: budgetError } = useAppSelector((state) => state.budget);
  const selectedMonthLabel = monthLabel(selectedMonth);

  useEffect(() => { void dispatch(fetchExpenseSummary(selectedMonth)); void dispatch(fetchBudget(selectedMonth)); }, [dispatch, selectedMonth]);

  const monthSummary = summary?.month === selectedMonth ? summary : null;
  const expenses = monthSummary?.recentExpenses ?? [];
  const activeBudget = budget.month === selectedMonth ? budget : { month: selectedMonth, amount: 0 };
  const total = monthSummary?.total ?? 0;
  const remaining = activeBudget.amount - total;
  const budgetState = getBudgetStatus(total, activeBudget.amount);
  const budgetBarColor = budgetState.tone === "danger" ? "var(--danger)" : budgetState.tone === "positive" ? "var(--trend)" : budgetState.tone === "warning" ? "var(--warning)" : "var(--primary)";
  const highest = monthSummary?.largestExpense ?? null;
  const categoryRows = monthSummary?.byCategory ?? [];

  return <div className="page-stack">
    <section className="welcome-row"><div><p className="eyebrow">{todayLabel}</p><h1>{greeting()}, {user?.name.trim().split(/\s+/)[0] ?? "there"}.</h1><p className="page-lede">A clear view of your spending this month.</p></div><Link className="button button--primary" to="/expenses?new=1"><Icon name="plus" size={18} />Record expense</Link></section>
    <section className="dashboard-grid" aria-label={`${selectedMonthLabel} spending overview`}>
      <div className="dashboard-primary">
        <div className="section-heading dashboard-primary__heading"><div><h2>Month snapshot</h2></div><MonthPicker ariaLabel="Select dashboard month" onChange={setSelectedMonth} value={selectedMonth} /></div>
        <DashboardBudgetCard budget={activeBudget} budgetError={budgetError} barColor={budgetBarColor} highest={highest} loading={loading} onRetryBudget={() => void dispatch(fetchBudget(selectedMonth))} onRetrySummary={() => void dispatch(fetchExpenseSummary(selectedMonth))} remaining={remaining} status={budgetState} summaryError={summaryError} total={total} />
      </div>
      <CategoryBreakdown rows={categoryRows} total={total} />
    </section>
    <RecentExpenses expenses={expenses} onOpen={setSelectedExpense} />
    <ExpenseDetailDrawer expense={selectedExpense} onClose={() => setSelectedExpense(null)} onEdit={(expense) => { setSelectedExpense(null); navigate(`/expenses?edit=${expense.id}`); }} />
  </div>;
}
