import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchExpenseSummary } from "../store/slices/expensesSlice";
import { fetchBudget } from "../store/slices/budgetSlice";
import MetricCard from "../components/ui/MetricCard";
import StatusPill from "../components/ui/StatusPill";
import { Icon } from "../components/ui/Icon";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const monthLabel = (month: string) => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());

export default function DashboardPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [selectedMonth, setSelectedMonth] = useState("2026-10");
  const { summaryItems: expenses, summaryLoading: loading } = useAppSelector((state) => state.expenses);
  const budget = useAppSelector((state) => state.budget.current);
  const selectedMonthLabel = monthLabel(selectedMonth);

  useEffect(() => { void dispatch(fetchExpenseSummary(selectedMonth)); void dispatch(fetchBudget(selectedMonth)); }, [dispatch, selectedMonth]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = budget.amount - total;
  const highest = expenses.length ? expenses.reduce((max, expense) => expense.amount > max.amount ? expense : max, expenses[0]) : null;
  const categoryTotals = expenses.reduce<Record<string, number>>((totals, expense) => { totals[expense.category.name] = (totals[expense.category.name] ?? 0) + expense.amount; return totals; }, {});
  const categoryRows = Object.entries(categoryTotals).sort(([, left], [, right]) => right - left);

  return <div className="page-stack">
    <section className="welcome-row"><div><p className="eyebrow">{todayLabel}</p><h1>Good morning, {user?.name.split(" ")[0] ?? "there"}.</h1><p className="page-lede">A clear view of your money makes room for better decisions.</p></div><Link className="button button--primary" to="/expenses?new=1"><Icon name="plus" size={18} />Add expense</Link></section>
    <section className="dashboard-grid" aria-label={`${selectedMonthLabel} spending overview`}><div className="dashboard-primary"><div className="section-heading"><div><p className="eyebrow">{selectedMonthLabel}</p><h2>Your month at a glance</h2></div><label className="month-picker"><span className="sr-only">Select month</span><input aria-label="Select dashboard month" onChange={(event) => setSelectedMonth(event.target.value)} type="month" value={selectedMonth} /><span>⌄</span></label></div>
      <div className="metric-grid"><MetricCard detail="of your monthly budget" label="Total spent" tone="mint" value={money.format(total)} /><MetricCard detail={`left in ${monthLabel(selectedMonth)}`} label="Remaining" tone="sand" value={money.format(remaining)} /><MetricCard detail={highest?.category.name ?? "No expenses yet"} label="Largest expense" tone="lilac" value={money.format(highest?.amount ?? 0)} /></div>
      <div className="panel budget-panel"><div className="panel-heading"><div><h3>Monthly budget</h3><p>{loading ? "Refreshing your latest activity…" : remaining >= 0 ? "You’re on track to stay within your limit." : "A little attention will bring this month back into focus."}</p></div><StatusPill tone={remaining >= 0 ? "positive" : "warning"}>{remaining >= 0 ? "On track" : "Over budget"}</StatusPill></div><div className="budget-figure"><strong>{money.format(total)}</strong><span> / {money.format(budget.amount)}</span></div><div className="progress-track"><span style={{ width: `${budget.amount ? Math.min((total / budget.amount) * 100, 100) : 0}%` }} /></div><div className="budget-meta"><span>{budget.amount ? Math.round((total / budget.amount) * 100) : 0}% used</span><Link to="/budgets">Manage budget <Icon name="arrow" size={14} /></Link></div></div>
    </div><aside className="dashboard-side panel"><div className="panel-heading"><div><h3>Spending by category</h3><p>Where this month is going</p></div><Icon name="arrow" size={17} /></div>{categoryRows.length ? <div className="category-list">{categoryRows.map(([name, amount]) => { const item = expenses.find((expense) => expense.category.name === name); return <div className="category-row" key={name}><span className="category-swatch" style={{ background: item?.category.color }} /><span className="category-name">{name}</span><strong>{money.format(amount)}</strong><span className="category-percent">{total ? Math.round((amount / total) * 100) : 0}%</span><div className="category-bar"><span style={{ width: `${(amount / categoryRows[0][1]) * 100}%`, background: item?.category.color }} /></div></div>; })}</div> : <div className="empty-state"><strong>No spending yet</strong><span>Add your first expense to see the month take shape.</span></div>}<Link className="text-link" to="/expenses">View all expenses <Icon name="arrow" size={14} /></Link></aside></section>
    <section className="panel recent-panel"><div className="panel-heading"><div><h3>Recent expenses</h3><p>The latest activity across your accounts</p></div><Link className="button button--quiet" to="/expenses">See all <Icon name="arrow" size={15} /></Link></div>{expenses.length ? <div className="expense-list">{expenses.slice(0, 4).map((expense) => <div className="expense-row" key={expense.id}><span className="expense-icon" style={{ color: expense.category.color, background: `${expense.category.color}1c` }}><Icon name="receipt" size={17} /></span><div className="expense-title"><strong>{expense.title}</strong><span>{expense.category.name} · {expense.paymentMethod}</span></div><time dateTime={expense.date}>{new Date(`${expense.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time><strong className="expense-amount">{money.format(expense.amount)}</strong><button aria-label={`More actions for ${expense.title}`} className="row-menu" type="button">•••</button></div>)}</div> : <div className="empty-state"><strong>Your recent activity will appear here.</strong><span>Start by adding an expense.</span></div>}</section>
  </div>;
}
