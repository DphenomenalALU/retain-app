import { useEffect, useRef } from "react";
import type { Expense } from "../../types/retain";
import { getIconName, Icon } from "../ui/Icon";
import { categoryColors } from "../../data/categoryPalette";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

type ExpenseDetailDrawerProps = {
  expense: Expense | null;
  onClose: () => void;
  onEdit?: (expense: Expense) => void;
};

export default function ExpenseDetailDrawer({ expense, onClose, onEdit }: ExpenseDetailDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!expense) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab") return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]") ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); previousFocusRef.current?.focus(); previousFocusRef.current = null; };
  }, [expense]);

  if (!expense) return null;

  return <>
    <button aria-label="Close expense details" className="drawer-backdrop" onClick={onClose} type="button" />
    <aside aria-labelledby="expense-detail-title" aria-modal="true" className="detail-drawer" ref={drawerRef} role="dialog">
      <header className="detail-drawer__header"><div className="detail-drawer__heading"><Icon name={getIconName(expense.category.icon)} size={15} /><h2>Expense detail</h2></div><button aria-label="Close expense details" className="icon-button icon-button--small" onClick={onClose} ref={closeButtonRef} type="button"><Icon name="close" size={15} /></button></header>
      <div className="detail-drawer__scroll">
        <div className="detail-drawer__hero"><span className="expense-icon expense-icon--large" style={{ color: categoryColors(expense.category).foreground, background: categoryColors(expense.category).background, border: `1px solid ${categoryColors(expense.category).border}` }}><Icon name={getIconName(expense.category.icon)} size={22} /></span><div><h3 id="expense-detail-title">{expense.title}</h3><span className="category-label" style={{ color: categoryColors(expense.category).foreground, background: categoryColors(expense.category).background, borderColor: categoryColors(expense.category).border }}><span className="category-swatch" style={{ background: categoryColors(expense.category).foreground }} /><Icon name={getIconName(expense.category.icon)} size={12} />{expense.category.name}</span></div></div>
        <section className="detail-section"><h4>Expense summary</h4><div className="detail-grid"><div><span>Amount</span><strong>{money.format(expense.amount)}</strong></div><div><span>Date</span><strong>{formatDate(expense.date)}</strong></div><div><span>Payment</span><strong>{expense.paymentMethod}</strong></div><div><span>Category</span><strong>{expense.category.name}</strong></div></div></section>
        <section className="detail-section"><h4>Note</h4><p className={expense.note ? "detail-note" : "detail-note detail-note--empty"}>{expense.note || "No note was added to this expense."}</p></section>
        <section className="detail-section"><h4>Record context</h4><p className="detail-copy">This expense is part of your monthly record and is included in your budget progress.</p></section>
      </div>
      <footer className="detail-drawer__footer"><button className="button button--quiet" onClick={onClose} type="button">Done</button>{onEdit && <button className="button button--primary" onClick={() => onEdit(expense)} type="button">Edit expense</button>}</footer>
    </aside>
  </>;
}
