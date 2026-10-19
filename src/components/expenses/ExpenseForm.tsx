import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { apiRequest } from "../../lib/api";
import type { Expense, ExpenseCategory, ExpenseInput } from "../../types/retain";

type ExpenseFormProps = {
  categories: ExpenseCategory[];
  expense?: Expense | null;
  onCancel: () => void;
  onSaved: (expense: Expense) => void;
};

const today = new Date().toISOString().slice(0, 10);

export default function ExpenseForm({ categories, expense, onCancel, onSaved }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseInput>({
    title: expense?.title ?? "",
    amount: expense?.amount ?? 0,
    categoryId: expense?.category.id ?? categories[0]?.id ?? "",
    date: expense?.date ?? today,
    paymentMethod: expense?.paymentMethod ?? "Card",
    note: expense?.note ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        amount: expense.amount,
        categoryId: expense.category.id,
        date: expense.date,
        paymentMethod: expense.paymentMethod,
        note: expense.note ?? "",
      });
    }
  }, [expense]);

  useEffect(() => {
    if (!form.categoryId && categories[0]) {
      setForm((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  const update = (key: keyof ExpenseInput, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await apiRequest<{ item: Expense }>(expense ? `/expenses/${expense.id}` : "/expenses", {
        method: expense ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      onSaved(response.item);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save this expense.");
    } finally {
      setSaving(false);
    }
  };

  const fields: ReactNode = (
    <>
      <fieldset className="expense-dialog__section">
        <legend>Expense</legend>
        <div className="expense-form__fields">
          <label>
            Title
            <input onChange={(event) => update("title", event.target.value)} placeholder="e.g. Weekly groceries" required value={form.title} />
          </label>
          <label>
            Amount
            <input min="0.01" onChange={(event) => update("amount", Number(event.target.value))} required step="0.01" type="number" value={form.amount || ""} />
          </label>
          <label>
            Category
            <select onChange={(event) => update("categoryId", event.target.value)} required value={form.categoryId}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label>
            Date
            <input onChange={(event) => update("date", event.target.value)} required type="date" value={form.date} />
          </label>
          <label>
            Payment method
            <select onChange={(event) => update("paymentMethod", event.target.value as ExpenseInput["paymentMethod"])} value={form.paymentMethod}>
              <option>Card</option>
              <option>Transfer</option>
              <option>Cash</option>
            </select>
          </label>
        </div>
      </fieldset>
      <fieldset className="expense-dialog__section expense-dialog__section--context">
        <legend>Context</legend>
        <label className="expense-form__notes">
          Notes <span>Optional</span>
          <textarea onChange={(event) => update("note", event.target.value)} placeholder="A little context for future you" rows={3} value={form.note} />
        </label>
      </fieldset>
    </>
  );

  const footer: ReactNode = (
    <div className="expense-form__footer">
      {error && <p className="form-error" role="alert">{error}</p>}
      <div>
        <button className="button button--quiet" onClick={onCancel} type="button">Cancel</button>
        <button className="button button--primary" disabled={saving} type="submit">{saving ? "Saving…" : expense ? "Save changes" : "Record expense"}</button>
      </div>
    </div>
  );

  return <form className="expense-dialog__form" onSubmit={submit}>{fields}{footer}</form>;
}
