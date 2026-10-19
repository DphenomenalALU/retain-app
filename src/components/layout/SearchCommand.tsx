import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import type { Expense } from "../../types/retain";
import { getIconName, Icon } from "../ui/Icon";
import ExpenseDetailDrawer from "../expenses/ExpenseDetailDrawer";
import { categoryColors } from "../../data/categoryPalette";

const dateLabel = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function uniqueExpenses(expenses: Expense[]) {
  return Array.from(new Map(expenses.map((expense) => [expense.id, expense])).values());
}

export default function SearchCommand() {
  const navigate = useNavigate();
  const expenses = useAppSelector((state) => uniqueExpenses([...state.expenses.items, ...state.expenses.summaryItems]));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      event.preventDefault();
      setOpen((current) => !current);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      if (wasOpenRef.current) triggerRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    const onEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const filteredExpenses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return expenses.slice(0, 6);
    return expenses.filter((expense) => [expense.title, expense.category.name, expense.paymentMethod, expense.note ?? ""].some((value) => value.toLowerCase().includes(normalized))).slice(0, 8);
  }, [expenses, query]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };
  const openExpense = (expense: Expense) => { setOpen(false); setSelectedExpense(expense); };

  return (
    <>
      <button aria-keyshortcuts="Meta+K Control+K" aria-label="Search" className={`icon-button${open ? " icon-button--active" : ""}`} onClick={() => setOpen(true)} ref={triggerRef} type="button"><Icon name="search" size={15} /></button>
      {open && <>
        <button aria-label="Close search" className="search-overlay" onClick={() => setOpen(false)} type="button" />
        <section aria-describedby="search-dialog-description" aria-labelledby="search-dialog-title" aria-modal="true" className="search-dialog" role="dialog">
          <h2 className="sr-only" id="search-dialog-title">Search Retain</h2>
          <p className="sr-only" id="search-dialog-description">Search expenses by title, category, payment method, or note.</p>
          <div className="search-dialog__input-row">
            <Icon name="search" size={15} />
            <input autoComplete="off" onChange={(event) => setQuery(event.target.value)} placeholder="Search expenses, categories, notes…" ref={inputRef} spellCheck={false} value={query} />
            <kbd>Esc</kbd>
          </div>
          <div className="search-dialog__body">
            <div className="search-dialog__label">{query ? "Results" : "Recent expenses"}</div>
            {filteredExpenses.length ? <ul className="search-result-list" role="listbox">{filteredExpenses.map((expense) => { const palette = categoryColors(expense.category); return <li key={expense.id} role="option"><button className="search-result" onClick={() => openExpense(expense)} type="button"><span className="expense-icon" style={{ color: palette.foreground, background: palette.background, border: `1px solid ${palette.border}` }}><Icon name={getIconName(expense.category.icon)} size={15} /></span><span className="search-result__copy"><strong>{expense.title}</strong><small>{expense.category.name} · {dateLabel(expense.date)}</small></span><span className="search-result__amount">{money.format(expense.amount)}</span></button></li>; })}</ul> : <div className="search-empty">No results for “{query}”</div>}
            <div className="search-dialog__label search-dialog__label--actions">Actions</div>
            <div className="search-action-list">
              <button className="search-action" onClick={() => run(() => navigate("/expenses?new=1"))} type="button"><span className="search-action__icon"><Icon name="plus" size={14} /></span><span>Record expense</span><kbd>↵</kbd></button>
              <button className="search-action" onClick={() => run(() => navigate("/budgets"))} type="button"><span className="search-action__icon"><Icon name="wallet" size={14} /></span><span>Open budgets</span></button>
            </div>
          </div>
          <footer className="search-dialog__footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>↵</kbd> Open</span></footer>
        </section>
      </>}
      <ExpenseDetailDrawer expense={selectedExpense} onClose={() => setSelectedExpense(null)} onEdit={(expense) => { setSelectedExpense(null); navigate(`/expenses?edit=${expense.id}`); }} />
    </>
  );
}
