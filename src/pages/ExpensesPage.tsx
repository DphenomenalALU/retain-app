import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchExpenses, removeExpense, resetFilters, setFilter, upsertExpense } from "../store/slices/expensesSlice";
import type { Expense, ExpenseCategory } from "../types/retain";
import ExpenseDialog from "../components/expenses/ExpenseDialog";
import ExpenseDetailDrawer from "../components/expenses/ExpenseDetailDrawer";
import { getIconName, Icon } from "../components/ui/Icon";
import { categoryColors } from "../data/categoryPalette";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function ExpensesPage() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [formOpen, setFormOpen] = useState(searchParams.get("new") === "1" || Boolean(searchParams.get("edit")));
  const [editing, setEditing] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { items: expenses, total, totalPages, loading, error, filters } = useAppSelector((state) => state.expenses);

  useEffect(() => { apiRequest<{ items: ExpenseCategory[] }>("/categories").then(({ items }) => setCategories(items)).catch(() => setCategories([])); }, []);
  useEffect(() => { void dispatch(fetchExpenses()); }, [dispatch, filters.search, filters.categoryId, filters.paymentMethod, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortDirection, filters.page]);
  useEffect(() => { const editId = searchParams.get("edit"); const target = editId ? expenses.find((item) => item.id === editId) : null; if (target) { setEditing(target); setFormOpen(true); } }, [expenses, searchParams]);
  const openForm = (expense?: Expense) => { setEditing(expense ?? null); setFormOpen(true); setSearchParams(expense ? {} : { new: "1" }); };
  const closeForm = () => { setEditing(null); setFormOpen(false); setSearchParams({}); };
  const onSaved = (expense: Expense) => { dispatch(upsertExpense(expense)); closeForm(); void dispatch(fetchExpenses()); };
  const onDelete = async (expense: Expense) => { if (!window.confirm(`Delete “${expense.title}”?`)) return; setDeleteError(null); try { await apiRequest<{ ok: boolean }>(`/expenses/${expense.id}`, { method: "DELETE" }); dispatch(removeExpense(expense.id)); void dispatch(fetchExpenses()); } catch (requestError) { setDeleteError(requestError instanceof Error ? requestError.message : "Unable to delete this expense."); } };
  const filterChange = (key: "search" | "categoryId" | "paymentMethod" | "dateFrom" | "dateTo" | "sortBy" | "sortDirection", value: string) => dispatch(setFilter({ key, value }));

  return <div className="page-stack expenses-page">
    <section className="welcome-row"><div><p className="eyebrow">The record</p><h1>Expenses</h1><p className="page-lede">A searchable record of the choices behind this month.</p></div><button className="button button--primary" onClick={() => openForm()} type="button"><Icon name="plus" size={18} />Record expense</button></section>
    {formOpen && <ExpenseDialog categories={categories} expense={editing} onCancel={closeForm} onSaved={onSaved} />}
    <section className="panel">
      <div className="filter-bar"><div className="search-field"><span className="search-field__icon"><Icon name="search" size={15} /></span><input aria-label="Search expenses" onChange={(event) => filterChange("search", event.target.value)} placeholder="Search the record" value={filters.search} /></div><select aria-label="Filter by category" className="filter-button filter-bar__select" onChange={(event) => filterChange("categoryId", event.target.value)} value={filters.categoryId}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select aria-label="Filter by payment method" className="filter-button filter-bar__select" onChange={(event) => filterChange("paymentMethod", event.target.value)} value={filters.paymentMethod}><option value="">All payment methods</option><option>Card</option><option>Transfer</option><option>Cash</option></select><label className="date-filter date-filter--from"><span>From</span><input aria-label="Filter expenses from date" onChange={(event) => filterChange("dateFrom", event.target.value)} type="date" value={filters.dateFrom} /></label><label className="date-filter date-filter--to"><span>To</span><input aria-label="Filter expenses to date" onChange={(event) => filterChange("dateTo", event.target.value)} type="date" value={filters.dateTo} /></label><select aria-label="Sort expenses" className="filter-button filter-bar__sort" onChange={(event) => { const [sortBy, sortDirection] = event.target.value.split("-") as ["date" | "amount", "asc" | "desc"]; filterChange("sortBy", sortBy); filterChange("sortDirection", sortDirection); }} value={`${filters.sortBy}-${filters.sortDirection}`}><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="amount-desc">Highest amount</option><option value="amount-asc">Lowest amount</option></select><button className="filter-reset" onClick={() => dispatch(resetFilters())} type="button">Reset</button></div>
      {deleteError && <p className="form-error form-error--banner" role="alert">{deleteError}</p>}{error && <p className="form-error form-error--banner" role="alert">{error}</p>}
      {loading ? <div className="loading-inline"><span className="loading-orb" />Refreshing the record…</div> : expenses.length ? <div className="table-wrap"><table><thead><tr><th>Expense</th><th>Category</th><th>Payment</th><th>Date</th><th className="align-right">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{expenses.map((expense) => { const palette = categoryColors(expense.category); return <tr className="expense-table-row" key={expense.id} onClick={() => setSelectedExpense(expense)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedExpense(expense); } }} role="button" tabIndex={0}><td><div className="table-expense"><span className="expense-icon" style={{ color: palette.foreground, background: palette.background, border: `1px solid ${palette.border}` }}><Icon name={getIconName(expense.category.icon)} size={16} /></span><strong>{expense.title}</strong></div></td><td><span className="category-label" style={{ color: palette.foreground, background: palette.background, borderColor: palette.border }}><span className="category-swatch" style={{ background: palette.foreground }} /><Icon name={getIconName(expense.category.icon)} size={12} />{expense.category.name}</span></td><td>{expense.paymentMethod}</td><td>{new Date(`${expense.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td><td className="align-right amount-cell">{money.format(expense.amount)}</td><td><div className="table-actions"><button aria-label={`Edit ${expense.title}`} onClick={(event) => { event.stopPropagation(); openForm(expense); }} type="button">Edit</button><button aria-label={`Delete ${expense.title}`} onClick={(event) => { event.stopPropagation(); void onDelete(expense); }} type="button">Delete</button></div></td></tr>; })}</tbody></table></div> : <div className="empty-state empty-state--panel"><strong>No expenses match these filters.</strong><span>Try resetting the filters or record a new expense.</span><button className="button button--quiet" onClick={() => openForm()} type="button">Record an expense <Icon name="plus" size={15} /></button></div>}
      <div className="pagination"><span>{total} {total === 1 ? "expense" : "expenses"}</span><div><button aria-label="Previous page" disabled={filters.page <= 1} onClick={() => dispatch(setFilter({ key: "page", value: filters.page - 1 }))} type="button">←</button><strong>Page {filters.page} of {totalPages}</strong><button aria-label="Next page" disabled={filters.page >= totalPages} onClick={() => dispatch(setFilter({ key: "page", value: filters.page + 1 }))} type="button">→</button></div></div>
    </section>
    <ExpenseDetailDrawer expense={selectedExpense} onClose={() => setSelectedExpense(null)} onEdit={(expense) => { setSelectedExpense(null); openForm(expense); }} />
  </div>;
}
