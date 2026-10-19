import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchExpenseSummary } from "../store/slices/expensesSlice";
import { fetchBudget, saveBudget } from "../store/slices/budgetSlice";
import MetricCard from "../components/ui/MetricCard";
import StatusPill from "../components/ui/StatusPill";
import MonthPicker from "../components/ui/MonthPicker";
import { Icon } from "../components/ui/Icon";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const monthLabel = (month: string) => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));

export default function BudgetsPage() {
  const dispatch = useAppDispatch();
  const expenses = useAppSelector((state) => state.expenses.summaryItems);
  const { current: budget, saving, error } = useAppSelector((state) => state.budget);
  const [selectedMonth, setSelectedMonth] = useState("2026-10");
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(budget.amount));
  const selectedMonthLabel = monthLabel(selectedMonth);
  useEffect(() => { void dispatch(fetchExpenseSummary(selectedMonth)); void dispatch(fetchBudget(selectedMonth)); }, [dispatch, selectedMonth]);
  useEffect(() => setAmount(String(budget.amount)), [budget.amount]);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = budget.amount - total;
  const usedPercentage = budget.amount ? Math.round((total / budget.amount) * 100) : 0;
  const save = async () => { await dispatch(saveBudget({ month: selectedMonth, amount: Number(amount) })).unwrap(); setEditing(false); };

  return <div className="page-stack">
    <section className="welcome-row"><div><p className="eyebrow">The limit</p><h1>Budgets</h1></div><button className="button button--primary" onClick={() => setEditing((open) => !open)} type="button"><Icon name={editing ? "close" : "edit"} size={15} />{editing ? "Close editor" : "Edit budget"}</button></section>
    <section aria-label="Budget period" className="panel budget-context"><span className="budget-context__label">Budget period</span><MonthPicker ariaLabel="Select budget month" onChange={setSelectedMonth} value={selectedMonth} /></section>
    {editing && <section className="panel budget-editor"><div><p className="eyebrow">{selectedMonthLabel}</p><h2>Set your monthly limit</h2><p>Choose a number that gives your plans room to breathe.</p></div><div className="budget-editor__controls"><label>Monthly budget<input min="0" onChange={(event) => setAmount(event.target.value)} step="0.01" type="number" value={amount} /></label><button className="button button--primary" disabled={saving} onClick={() => void save()} type="button">{saving ? "Saving…" : "Save budget"}</button></div></section>}
    {error && <p className="form-error form-error--banner" role="alert">{error}</p>}
    <div className="metric-grid metric-grid--wide budget-metrics"><MetricCard detail="current period" icon="wallet" label="Monthly limit" showIcon={false} tone="mint" value={money.format(budget.amount)} /><MetricCard detail={`${usedPercentage}% used`} icon="trend" label="Spent so far" showIcon={false} tone="sand" value={money.format(total)} /><MetricCard detail="remaining" icon="arrow" label="Still available" showIcon={false} tone="lilac" value={money.format(remaining)} /></div>
    <section className="panel budget-panel budget-panel--large"><div className="panel-heading"><div><h3>Monthly progress</h3><p>{remaining >= 0 ? "Spending is within the limit." : "Spending is above the limit."}</p></div><StatusPill tone={remaining >= 0 ? "positive" : "warning"}>{remaining >= 0 ? "On track" : "Over budget"}</StatusPill></div><div className="budget-figure"><strong>{money.format(total)}</strong><span> / {money.format(budget.amount)}</span></div><div className="progress-track"><span style={{ width: `${budget.amount ? Math.min((total / budget.amount) * 100, 100) : 0}%` }} /></div><div className="budget-meta"><span>{budget.amount ? Math.round((total / budget.amount) * 100) : 0}% used</span><span>{money.format(remaining)} remaining</span></div></section>
  </div>;
}
