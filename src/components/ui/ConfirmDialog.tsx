import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ open, title, description, confirmLabel, busy = false, onCancel, onConfirm }: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onCancel(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => cancelButtonRef.current?.focus());
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); previousFocusRef.current?.focus(); previousFocusRef.current = null; };
  }, [busy, onCancel, open]);

  if (!open) return null;

  return <>
    <button aria-label="Close confirmation dialog" className="confirm-dialog-backdrop" onClick={() => { if (!busy) onCancel(); }} type="button" />
    <section aria-describedby="confirm-dialog-description" aria-labelledby="confirm-dialog-title" aria-modal="true" className="confirm-dialog" role="dialog">
      <div className="confirm-dialog__eyebrow">Account action</div>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-description">{description}</p>
      <div className="confirm-dialog__actions">
        <button className="button button--quiet" disabled={busy} onClick={onCancel} ref={cancelButtonRef} type="button">Keep account</button>
        <button className="button button--danger" disabled={busy} onClick={onConfirm} type="button">{busy ? "Removing…" : confirmLabel}</button>
      </div>
    </section>
  </>;
}
