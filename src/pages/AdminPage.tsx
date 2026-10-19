import { useEffect, useState, type FormEvent } from "react";
import MetricCard from "../components/ui/MetricCard";
import { getIconName, Icon, type IconName } from "../components/ui/Icon";
import { apiRequest } from "../lib/api";
import CategoryIconPicker from "../components/admin/CategoryIconPicker";
import ExpenseDetailDrawer from "../components/expenses/ExpenseDetailDrawer";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { AdminCategory, AdminInsights, AdminUser, Expense, ExpenseCategory } from "../types/retain";
import { categoryColors } from "../data/categoryPalette";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const date = (value: string) => new Date(`${value}${value.length === 10 ? "T12:00:00" : ""}`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const monthLabel = (value: string) => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00`));
const initials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
type CategoryForm = { name: string; color: string; icon: IconName };
const emptyForm: CategoryForm = { name: "", color: "#CFCFCF", icon: "tag" };

export default function AdminPage() {
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdmin = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextInsights, categoryResponse] = await Promise.all([
        apiRequest<AdminInsights>("/admin/insights"),
        apiRequest<{ items: AdminCategory[] }>("/categories"),
      ]);
      setInsights(nextInsights);
      setCategories(categoryResponse.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAdmin(); }, []);

  const submitCategory = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await apiRequest<{ item: AdminCategory }>(editingId ? `/categories/${editingId}` : "/categories", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setCategories((current) => editingId ? current.map((category) => category.id === editingId ? response.item : category) : [...current, response.item]);
      setForm(emptyForm);
      setEditingId(null);
      await loadAdmin();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  const editCategory = (category: AdminCategory) => {
    setEditingId(category.id);
    setForm({ name: category.name, color: category.color, icon: getIconName(category.icon) });
  };

  const requestDeleteCategory = (category: AdminCategory) => setCategoryToDelete(category);

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const category = categoryToDelete;
    setDeletingCategoryId(category.id);
    setError(null);
    try {
      await apiRequest<{ ok: boolean }>(`/categories/${category.id}`, { method: "DELETE" });
      if (editingId === category.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      setCategoryToDelete(null);
      await loadAdmin();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete category.");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const copyEmail = async (user: AdminUser) => {
    try {
      await navigator.clipboard.writeText(user.email);
      setCopiedUserId(user.id);
      window.setTimeout(() => setCopiedUserId((current) => current === user.id ? null : current), 1400);
    } catch {
      setCopiedUserId(null);
    }
  };

  const deleteUser = (user: AdminUser) => setUserToDelete(user);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const user = userToDelete;
    setDeletingUserId(user.id);
    setError(null);
    try {
      await apiRequest<{ ok: boolean }>(`/users/${user.id}`, { method: "DELETE" });
      setUserToDelete(null);
      await loadAdmin();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove account.");
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading && !insights) return <div className="loading-inline"><span className="loading-orb" />Refreshing admin workspace…</div>;
  if (error && !insights) return <section className="panel empty-state empty-state--panel"><strong>Admin data is unavailable.</strong><span>{error}</span><button className="button button--quiet" onClick={() => void loadAdmin()} type="button">Try again</button></section>;
  if (!insights) return null;

  const maxSpend = Math.max(...insights.spendingByCategory.map((item) => item.total), 1);
  const totalSpend = insights.totals.value;
  const categoryFor = (category: ExpenseCategory) => { const palette = categoryColors(category); return <span className="category-label" style={{ color: palette.foreground, background: palette.background, borderColor: palette.border }}><span className="category-swatch" style={{ background: palette.foreground }} /><Icon name={getIconName(category.icon)} size={12} />{category.name}</span>; };

  return <div className="page-stack admin-page">
    <section className="welcome-row"><div><p className="eyebrow">Restricted workspace</p><h1>Admin space</h1><p className="page-lede">People, categories, and platform activity.</p></div><span className="admin-badge"><span className="status-pill__dot" />Live insights</span></section>
    {error && <p className="form-error form-error--banner" role="alert">{error}</p>}
    <div className="metric-grid admin-metric-grid"><MetricCard detail="across all accounts" icon="users" label="Registered users" tone="mint" value={String(insights.totals.users)} /><MetricCard detail="recorded in Retain" icon="receipt" label="Total expenses" tone="sand" value={String(insights.totals.expenses)} /><MetricCard detail="across the platform" icon="wallet" label="Expense value" tone="lilac" value={money.format(insights.totals.value)} /><MetricCard detail={`${monthLabel(insights.currentMonth)} activity`} icon="calendar" label="This month" tone="peach" value={String(insights.totals.currentMonthExpenses)} /></div>

    <section className="admin-grid admin-grid--primary"><section className="panel recent-panel"><div className="panel-heading"><div><h3>Recently added expenses</h3><p>Latest platform activity, across all accounts.</p></div></div><div className="admin-recent-expenses"><div aria-hidden="true" className="admin-expense-header"><span /><span>Expense</span><span>Amount</span><span>Date</span><span>Added by</span></div>{insights.recentExpenses.map((expense) => { const palette = categoryColors(expense.category); return <div className="admin-expense-row person-row--interactive" key={expense.id} onClick={() => setSelectedExpense(expense)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedExpense(expense); } }} role="button" tabIndex={0}><span className="expense-icon" style={{ color: palette.foreground, background: palette.background, border: `1px solid ${palette.border}` }}><Icon name={getIconName(expense.category.icon)} size={18} /></span><div className="admin-expense__copy"><strong>{expense.title}</strong><small>{expense.category.name} · {expense.paymentMethod}</small></div><strong className="amount-cell">{money.format(expense.amount)}</strong><time dateTime={expense.date}>{date(expense.date)}</time><div className="admin-expense__user"><span className="avatar">{initials(expense.user.name)}</span><div className="admin-expense__user-copy"><span>{expense.user.name}</span></div></div></div>; })}</div></section>

      <div className="panel">
        <div className="panel-heading"><div><h3>Expense categories</h3><p>Shared labels used across expenses.</p></div></div>
        <form className="category-form" onSubmit={submitCategory}>
          <div className="category-name-field">
            <span>{editingId ? "Edit category" : "New category"}</span>
            <div className="category-name-control">
              <CategoryIconPicker inline value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
              <input aria-label="Category name" maxLength={40} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Subscriptions" required value={form.name} />
            </div>
          </div>
          <label className="category-color-field"><span>Color</span><input aria-label="Category color" onChange={(event) => setForm({ ...form, color: event.target.value })} type="color" value={form.color} /></label>
          <button className="button button--primary" disabled={saving} type="submit">{saving ? "Saving…" : editingId ? "Save changes" : "Add category"}</button>
          {editingId && <button className="button button--quiet" onClick={() => { setEditingId(null); setForm(emptyForm); }} type="button">Cancel</button>}
        </form>
        <div className="admin-list">{categories.map((category) => { const palette = categoryColors(category); return <div className="admin-row" key={category.id}><span className="admin-category-icon" style={{ color: palette.foreground, background: palette.background, border: `1px solid ${palette.border}` }}><Icon name={getIconName(category.icon)} size={17} /></span><strong>{category.name}</strong><span>{category.expenseCount} {category.expenseCount === 1 ? "expense" : "expenses"}</span>{category.isSystem ? <span className="system-label">System</span> : <div className="table-actions"><button aria-label={`Edit ${category.name}`} onClick={() => editCategory(category)} type="button">Edit</button><button aria-label={`Delete ${category.name}`} onClick={() => requestDeleteCategory(category)} type="button">Delete</button></div>}</div>; })}</div>
      </div></section>
    <section className="panel admin-wide-panel"><div className="panel-heading"><div><h3>Spending by category</h3><p>Platform-wide value and volume.</p></div></div><div className="admin-bars">{insights.spendingByCategory.map((item) => { const palette = categoryColors(item.category); const share = totalSpend ? Math.round((item.total / totalSpend) * 100) : 0; return <div className="admin-bar-row" key={item.category.id}><div className="admin-bar-label">{categoryFor(item.category)}<div className="admin-bar-value"><strong>{money.format(item.total)}</strong><span>{share}%</span></div></div><div className="admin-bar-track"><span style={{ background: palette.foreground, width: `${(item.total / maxSpend) * 100}%` }} /></div><small>{item.count} {item.count === 1 ? "expense" : "expenses"}</small></div>; })}</div></section>

    <section className="admin-grid"><div className="panel"><div className="panel-heading"><div><h3>Category usage</h3><p>Most and least-used labels by record count.</p></div></div><div className="usage-columns"><div><p className="mini-heading">Top 5</p>{insights.topCategories.map((item) => { const share = insights.totals.expenses ? Math.round((item.count / insights.totals.expenses) * 100) : 0; return <div className="usage-row" key={`top-${item.category.id}`}>{categoryFor(item.category)}<strong>{item.count}<small>{share}%</small></strong></div>; })}</div><div><p className="mini-heading">Bottom 5</p>{insights.bottomCategories.map((item) => { const share = insights.totals.expenses ? Math.round((item.count / insights.totals.expenses) * 100) : 0; return <div className="usage-row" key={`bottom-${item.category.id}`}>{categoryFor(item.category)}<strong>{item.count}<small>{share}%</small></strong></div>; })}</div></div></div><div className="panel"><div className="panel-heading"><div><h3>Recently registered</h3><p>Newest accounts.</p></div></div><div className="admin-people">{insights.recentUsers.map((user) => <div className="person-row admin-user-row" key={user.id}><span className="avatar">{initials(user.name)}</span><div><strong>{user.name}</strong><small>{user.email}</small></div><time dateTime={user.createdAt}>{date(user.createdAt)}</time><div className="person-row__actions"><a className="person-row__action" href={`mailto:${user.email}`}>Email</a><button className="person-row__action" onClick={() => void copyEmail(user)} type="button">{copiedUserId === user.id ? "Copied" : "Copy email"}</button>{user.role !== "admin" && <button className="person-row__action person-row__action--danger" onClick={() => void deleteUser(user)} type="button">Delete</button>}</div></div>)}</div></div></section>
    <ExpenseDetailDrawer expense={selectedExpense} onClose={() => setSelectedExpense(null)} />
    <ConfirmDialog busy={Boolean(deletingCategoryId)} busyLabel="Deleting…" cancelLabel="Keep category" confirmLabel="Delete category" description={categoryToDelete ? `Existing expenses will move to Uncategorized when “${categoryToDelete.name}” is deleted.` : "Existing expenses will move to Uncategorized."} eyebrow="Category action" onCancel={() => setCategoryToDelete(null)} onConfirm={() => void confirmDeleteCategory()} open={Boolean(categoryToDelete)} title={categoryToDelete ? `Delete “${categoryToDelete.name}”?` : "Delete category?"} />
    <ConfirmDialog busy={Boolean(deletingUserId)} busyLabel="Removing…" cancelLabel="Keep account" confirmLabel="Remove account" description={userToDelete ? `${userToDelete.name}'s expenses and budgets will also be removed.` : "This account and its financial records will be removed."} eyebrow="Account action" onCancel={() => setUserToDelete(null)} onConfirm={() => void confirmDeleteUser()} open={Boolean(userToDelete)} title={userToDelete ? `Remove ${userToDelete.name}'s account?` : "Remove account?"} />
  </div>;
}
