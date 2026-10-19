import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
const monthNames = Array.from({ length: 12 }, (_, index) => monthFormatter.format(new Date(2000, index, 1)));

function parseMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { year: year || new Date().getFullYear(), monthIndex: Math.min(Math.max((month || 1) - 1, 0), 11) };
}

type MonthPickerProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export default function MonthPicker({ value, onChange, ariaLabel = "Select month" }: MonthPickerProps) {
  const { year, monthIndex } = parseMonth(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!pickerRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  const toggle = () => {
    if (!open) setViewYear(year);
    setOpen((current) => !current);
  };

  const chooseMonth = (nextMonthIndex: number) => {
    onChange(`${viewYear}-${String(nextMonthIndex + 1).padStart(2, "0")}`);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return <div className="month-picker month-picker--custom" ref={pickerRef}>
    <button aria-expanded={open} aria-haspopup="dialog" aria-label={`${ariaLabel}: ${monthNames[monthIndex]} ${year}`} className="month-picker__trigger" onClick={toggle} ref={triggerRef} type="button">
      <span>{monthNames[monthIndex]} {year}</span>
      <Icon className="month-picker__icon" name="calendar" size={13} />
    </button>
    {open && <div aria-label="Choose a month" className="month-picker__popover" role="dialog">
      <div className="month-picker__header">
        <button aria-label="Previous year" className="month-picker__year-button" onClick={() => setViewYear((current) => current - 1)} type="button">←</button>
        <strong>{viewYear}</strong>
        <button aria-label="Next year" className="month-picker__year-button" onClick={() => setViewYear((current) => current + 1)} type="button">→</button>
      </div>
      <div aria-label={`${viewYear} months`} className="month-picker__grid" role="listbox">
        {monthNames.map((monthName, index) => <button aria-selected={viewYear === year && index === monthIndex} className={viewYear === year && index === monthIndex ? "month-picker__month is-selected" : "month-picker__month"} key={monthName} onClick={() => chooseMonth(index)} role="option" type="button">{monthName.slice(0, 3)}</button>)}
      </div>
    </div>}
  </div>;
}
