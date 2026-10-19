import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchExpenseSummary } from "../store/slices/expensesSlice";
import { fetchBudget } from "../store/slices/budgetSlice";
import type { Expense } from "../types/retain";
import { getIconName, Icon } from "../components/ui/Icon";
import { categoryColors } from "../data/categoryPalette";
import MonthPicker from "../components/ui/MonthPicker";
import ExpenseDetailDrawer from "../components/expenses/ExpenseDetailDrawer";
import { currentMonth } from "../lib/date";
import { getBudgetStatus } from "../lib/budget";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const monthLabel = (month: string) => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
const greeting = () => { const hour = new Date().getHours(); return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; };

export default function DashboardPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { summaryItems: expenses, summaryLoading: loading } = useAppSelector((state) => state.expenses);
  const budget = useAppSelector((state) => state.budget.current);
  const selectedMonthLabel = monthLabel(selectedMonth);

  useEffect(() => { void dispatch(fetchExpenseSummary(selectedMonth)); void dispatch(fetchBudget(selectedMonth)); }, [dispatch, selectedMonth]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = budget.amount - total;
  const budgetState = getBudgetStatus(total, budget.amount);
  const budgetBarColor = budgetState.tone === "danger" ? "var(--danger)" : budgetState.tone === "positive" ? "var(--trend)" : budgetState.tone === "warning" ? "var(--warning)" : "var(--primary)";
  const highest = expenses.length ? expenses.reduce((max, expense) => expense.amount > max.amount ? expense : max, expenses[0]) : null;
  const categoryTotals = expenses.reduce<Record<string, number>>((totals, expense) => { totals[expense.category.name] = (totals[expense.category.name] ?? 0) + expense.amount; return totals; }, {});
  const categoryRows = Object.entries(categoryTotals).sort(([, left], [, right]) => right - left);

  return <div className="page-stack">
    <section className="welcome-row"><div><p className="eyebrow">{todayLabel}</p><h1>{greeting()}, {user?.name.trim().split(/\s+/)[0] ?? "there"}.</h1><p className="page-lede">A clear view of your spending this month.</p></div><Link className="button button--primary" to="/expenses?new=1"><Icon name="plus" size={18} />Record expense</Link></section>
    <section className="dashboard-grid" aria-label={`${selectedMonthLabel} spending overview`}>
      <div className="dashboard-primary">
        <div className="section-heading dashboard-primary__heading"><div><h2>Month snapshot</h2></div><MonthPicker ariaLabel="Select dashboard month" onChange={setSelectedMonth} value={selectedMonth} /></div>
        <div className="panel budget-panel budget-panel--overview">
          <div className="budget-overview__top"><p className="budget-overview__label">Spent this month</p><Link className="button button--quiet" to="/budgets">Manage budget <Icon name="arrow" size={14} /></Link></div>
          <div className="budget-overview__meter"><div className="budget-figure"><strong>{money.format(total)}</strong><span>of {money.format(budget.amount)}</span></div><div className="progress-track"><span style={{ background: budgetBarColor, width: `${budget.amount ? Math.min(budgetState.ratio * 100, 100) : 0}%` }} /></div><div className="budget-meta"><span>{budget.amount ? `${budgetState.percentage}% of budget used` : "Set a budget to track progress"}</span><span className={`budget-status budget-status--${budgetState.tone}`}><span className="budget-status__dot" />{budgetState.label}</span></div></div>
          <div className="budget-support-grid"><div className="budget-support-stat"><span>Remaining</span><strong>{money.format(remaining)}</strong><small>available this month</small></div><div className="budget-support-stat"><span>Largest expense</span><strong>{money.format(highest?.amount ?? 0)}</strong><small>{highest ? `${highest.title} · ${highest.category.name}` : "No expenses yet"}</small></div></div>
          {loading && <span className="budget-refreshing"><span className="loading-orb" />Refreshing activity</span>}
        </div>
      </div>
      <aside aria-labelledby="category-breakdown-title" className="dashboard-side"><div className="section-heading dashboard-side__heading"><h2 id="category-breakdown-title">Spending by category</h2><Link className="text-link" to="/expenses">View all <Icon name="arrow" size={14} /></Link></div><div className="panel dashboard-side__panel">{categoryRows.length ? <div className="category-list">{categoryRows.map(([name, amount]) => { const item = expenses.find((expense) => expense.category.name === name); const palette = categoryColors(item?.category); const share = total ? Math.round((amount / total) * 100) : 0; return <div className="category-row" key={name}><div className="category-row__top"><span className="category-row-icon" style={{ color: palette.foreground, background: palette.background, border: `1px solid ${palette.border}` }}><Icon name={getIconName(item?.category.icon)} size={15} /></span><span className="category-name">{name}</span><span className="category-percent">{share}%</span><strong className="category-amount">{money.format(amount)}</strong></div><div className="category-bar"><span style={{ width: `${(amount / categoryRows[0][1]) * 100}%`, background: palette.foreground }} /></div></div>; })}</div> : <div className="empty-state"><strong>No spending yet</strong><span>Add your first expense to see the month take shape.</span></div>}</div></aside>
    </section>
    <section className="panel recent-panel"><div className="panel-heading"><div><h3>Recent expenses</h3></div><Link className="button button--quiet" to="/expenses">See all <Icon name="arrow" size={15} /></Link></div>{expenses.length ? <><div aria-hidden="true" className="expense-list__header"><span /><span>Date</span><span>Amount</span><span /></div><div className="expense-list">{expenses.slice(0, 4).map((expense) => <div className="expense-row" key={expense.id} onClick={() => setSelectedExpense(expense)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedExpense(expense); } }} role="button" tabIndex={0}><span className="expense-icon" style={{ color: expense.category.color, background: `${expense.category.color}1c` }}><Icon name={getIconName(expense.category.icon)} size={18} /></span><div className="expense-title"><strong>{expense.title}</strong><span>{expense.category.name} · {expense.paymentMethod}</span></div><time dateTime={expense.date}>{new Date(`${expense.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time><strong className="expense-amount">{money.format(expense.amount)}</strong><button aria-label={`Open details for ${expense.title}`} className="row-menu" onClick={(event) => { event.stopPropagation(); setSelectedExpense(expense); }} type="button"><Icon name="more" size={17} /></button></div>)}</div></> : <div className="empty-state"><strong>Your recent activity will appear here.</strong><span>Start by adding an expense.</span></div>}</section>
    <ExpenseDetailDrawer expense={selectedExpense} onClose={() => setSelectedExpense(null)} onEdit={(expense) => { setSelectedExpense(null); navigate(`/expenses?edit=${expense.id}`); }} />
  </div>;
}
