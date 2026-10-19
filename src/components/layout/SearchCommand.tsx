import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearSearchResults, searchExpenses } from "../../store/slices/expensesSlice";
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
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.expenses.items);
  const recentExpenses = useAppSelector((state) => state.expenses.summary?.recentExpenses ?? []);
  const searchResults = useAppSelector((state) => state.expenses.searchResults);
  const searchLoading = useAppSelector((state) => state.expenses.searchLoading);
  const searchError = useAppSelector((state) => state.expenses.searchError);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  const expenses = useMemo(() => uniqueExpenses(query.trim() ? searchResults : [...recentExpenses, ...items]), [items, query, recentExpenses, searchResults]);

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
    if (!open || !query.trim()) {
      if (open) dispatch(clearSearchResults());
      return;
    }
    const timeout = window.setTimeout(() => { void dispatch(searchExpenses(query.trim())); }, 220);
    return () => window.clearTimeout(timeout);
  }, [dispatch, open, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      if (wasOpenRef.current) triggerRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }
    wasOpenRef.current = true;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])") ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onEscape);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [open]);

  const filteredExpenses = expenses.slice(0, query.trim() ? 8 : 6);

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
        <section aria-describedby="search-dialog-description" aria-labelledby="search-dialog-title" aria-modal="true" className="search-dialog" ref={dialogRef} role="dialog">
          <h2 className="sr-only" id="search-dialog-title">Search Retain</h2>
          <p className="sr-only" id="search-dialog-description">Search expenses by title, category, payment method, or note.</p>
          <div className="search-dialog__input-row">
            <Icon name="search" size={15} />
            <input autoComplete="off" onChange={(event) => setQuery(event.target.value)} placeholder="Search expenses, categories, notes…" ref={inputRef} spellCheck={false} value={query} />
            <kbd>Esc</kbd>
          </div>
          <div className="search-dialog__body">
            <div className="search-dialog__label">{query ? "Results" : "Recent expenses"}</div>
            {searchLoading ? <div className="search-empty"><span className="loading-orb" />Searching the record…</div> : searchError ? <div className="search-empty">{searchError}</div> : filteredExpenses.length ? <ul className="search-result-list" role="listbox">{filteredExpenses.map((expense) => { const palette = categoryColors(expense.category); return <li key={expense.id} role="option"><button className="search-result" onClick={() => openExpense(expense)} type="button"><span className="expense-icon" style={{ color: palette.foreground, background: palette.background, border: `1px solid ${palette.border}` }}><Icon name={getIconName(expense.category.icon)} size={15} /></span><span className="search-result__copy"><strong>{expense.title}</strong><small>{expense.category.name} · {dateLabel(expense.date)}</small></span><span className="search-result__amount">{money.format(expense.amount)}</span></button></li>; })}</ul> : <div className="search-empty">No results for “{query}”</div>}
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
