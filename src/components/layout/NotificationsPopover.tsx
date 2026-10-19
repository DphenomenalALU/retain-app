import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { useAuth } from "../../context/AuthContext";
import type { Expense } from "../../types/retain";
import { getIconName, Icon } from "../ui/Icon";
import ExpenseDetailDrawer from "../expenses/ExpenseDetailDrawer";

type FeedFilter = "all" | "unread";
type ActivityItem = { id: string; message: string; meta: string; expense?: Expense; tone: "expense" | "budget" };

const dateLabel = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));

function uniqueExpenses(expenses: Expense[]) {
  return Array.from(new Map(expenses.map((expense) => [expense.id, expense])).values());
}

export default function NotificationsPopover() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const items = useAppSelector((state) => state.expenses.items);
  const recentExpenses = useAppSelector((state) => state.expenses.summary?.recentExpenses ?? []);
  const summaryTotal = useAppSelector((state) => state.expenses.summary?.total);
  const budget = useAppSelector((state) => state.budget.current);
  const expenses = useMemo(() => uniqueExpenses([...recentExpenses, ...items]), [items, recentExpenses]);

  const activity = useMemo<ActivityItem[]>(() => {
    const expenseItems = expenses.slice(0, 6).map((expense) => ({ id: expense.id, message: `Recorded “${expense.title}”`, meta: `${expense.category.name} · ${dateLabel(expense.date)}`, expense, tone: "expense" as const }));
    const total = summaryTotal ?? expenses.reduce((sum, expense) => sum + expense.amount, 0);
    if (budget.amount > 0 && total > budget.amount) return [{ id: "budget-over", message: "This month is over budget", meta: `${Math.round((total / budget.amount) * 100)}% used · Review your budget`, tone: "budget" }, ...expenseItems];
    return expenseItems;
  }, [budget.amount, expenses, summaryTotal]);

  const unread = activity.filter((item) => !readIds.includes(item.id));
  const visible = filter === "unread" ? unread : activity;
  const markRead = (id: string) => setReadIds((current) => current.includes(id) ? current : [...current, id]);
  const markAllRead = () => setReadIds(activity.map((item) => item.id));

  useEffect(() => { setReadIds([]); setFilter("all"); }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!anchorRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  return <div className="notification-anchor" ref={anchorRef}>
    <button aria-expanded={open} aria-haspopup="dialog" aria-label={unread.length ? `Notifications, ${unread.length} unread` : "Notifications"} className={`icon-button${open ? " icon-button--active" : ""}`} onClick={() => setOpen((current) => !current)} ref={triggerRef} type="button"><Icon name="bell" size={15} />{unread.length > 0 && <span aria-hidden className="notification-dot" />}</button>
    {open && <section aria-label="Notifications" className="notification-popover" role="dialog">
      <header className="notification-popover__header"><div><h2>Notifications</h2>{unread.length > 0 && <span className="count-badge">{unread.length}</span>}</div><button className="notification-mark-read" disabled={!unread.length} onClick={markAllRead} type="button">Mark all as read</button></header>
      <div className="notification-tabs" role="tablist"><button aria-selected={filter === "all"} className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")} role="tab" type="button">All</button><button aria-selected={filter === "unread"} className={filter === "unread" ? "is-active" : ""} onClick={() => setFilter("unread")} role="tab" type="button">Unread</button></div>
      {visible.length ? <ul className="notification-list">{visible.map((item) => <li className={readIds.includes(item.id) ? "notification-item" : "notification-item notification-item--unread"} key={item.id}><button onClick={() => { markRead(item.id); setOpen(false); if (item.expense) setSelectedExpense(item.expense); else navigate("/budgets"); }} type="button"><span className={`notification-item__icon notification-item__icon--${item.tone}`}><Icon name={item.expense ? getIconName(item.expense.category.icon) : "wallet"} size={15} /></span><span className="notification-item__copy"><strong>{item.message}</strong><small>{item.meta}</small></span>{!readIds.includes(item.id) && <span aria-label="Unread" className="notification-item__dot" />}</button></li>)}</ul> : <div className="notification-empty"><span className="notification-empty__icon"><Icon name="bell" size={15} /></span><strong>You’re all caught up</strong><span>New activity from your record will show up here.</span></div>}
    </section>}
    <ExpenseDetailDrawer expense={selectedExpense} onClose={() => setSelectedExpense(null)} onEdit={(expense) => { setSelectedExpense(null); navigate(`/expenses?edit=${expense.id}`); }} />
  </div>;
}
