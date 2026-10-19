import { useEffect, useRef } from "react";
import type { Expense, ExpenseCategory } from "../../types/retain";
import { Icon } from "../ui/Icon";
import ExpenseForm from "./ExpenseForm";

type ExpenseDialogProps = {
  categories: ExpenseCategory[];
  expense?: Expense | null;
  loading?: boolean;
  onCancel: () => void;
  onSaved: (expense: Expense) => void;
};

export default function ExpenseDialog({ categories, expense, loading = false, onCancel, onSaved }: ExpenseDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancelRef.current();
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])") ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, []);

  return (
    <>
      <button aria-label="Close record dialog" className="expense-modal-backdrop" onClick={onCancel} type="button" />
      <section aria-labelledby="expense-dialog-title" aria-modal="true" className="expense-dialog" ref={dialogRef} role="dialog">
        <header className="expense-dialog__header">
          <div>
            <p className="eyebrow">{expense ? "Edit record" : "New record"}</p>
            <h2 id="expense-dialog-title">{expense ? "Update expense" : "Record expense"}</h2>
            <p>{expense ? "Keep the record accurate with a quick update." : "Add a purchase to your monthly record."}</p>
          </div>
          <button aria-label="Close record dialog" className="icon-button icon-button--small" onClick={onCancel} ref={closeButtonRef} type="button"><Icon name="close" size={16} /></button>
        </header>
        <div className="expense-dialog__scroll">
          {loading ? <div className="loading-inline"><span className="loading-orb" />Opening expense…</div> : <ExpenseForm categories={categories} expense={expense} onCancel={onCancel} onSaved={onSaved} />}
        </div>
      </section>
    </>
  );
}
