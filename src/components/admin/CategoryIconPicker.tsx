import { useEffect, useMemo, useRef, useState } from "react";
import { iconCatalog, type IconName, Icon } from "../ui/Icon";

type CategoryIconPickerProps = {
  value: IconName;
  onChange: (value: IconName) => void;
  inline?: boolean;
};

export default function CategoryIconPicker({ value, onChange, inline = false }: CategoryIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectedIcon = iconCatalog.find((icon) => icon.name === value) ?? iconCatalog[iconCatalog.length - 1];

  const visibleIcons = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? iconCatalog.filter((icon) => icon.label.toLowerCase().includes(normalized)) : iconCatalog;
  }, [query]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => searchRef.current?.focus());
    const onPointerDown = (event: PointerEvent) => { if (!pickerRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  const chooseIcon = (icon: IconName) => { onChange(icon); setOpen(false); setQuery(""); triggerRef.current?.focus(); };

  return <div className={`category-icon-picker${inline ? " category-icon-picker--inline" : ""}`} ref={pickerRef}>
    {!inline && <div className="category-icon-picker__heading"><span>Icon</span><strong>{selectedIcon.label}</strong></div>}
    <button aria-label={`Choose category icon, current ${selectedIcon.label}`} aria-controls="category-icon-options" aria-expanded={open} className={`category-icon-trigger${open ? " is-open" : ""}`} onClick={() => setOpen((current) => !current)} ref={triggerRef} type="button">
      <span className="category-icon-trigger__glyph"><Icon name={selectedIcon.name} size={17} /></span>
      <span className="category-icon-trigger__copy"><strong>{selectedIcon.label}</strong><small>Choose a category icon</small></span>
      <Icon className="category-icon-trigger__chevron" name="chevron" size={14} />
    </button>
    {open && <div className="category-icon-popover" id="category-icon-options" role="dialog">
      <div className="category-icon-popover__topline"><div><strong>Choose an icon</strong><span>{visibleIcons.length} available</span></div><kbd>Esc</kbd></div>
      <div className="category-icon-picker__search"><Icon name="search" size={13} /><input aria-label="Search category icons" onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" ref={searchRef} value={query} /></div>
      <div aria-label="Category icon options" className="category-icon-grid" role="listbox">{visibleIcons.map((icon) => <button aria-label={icon.label} aria-selected={value === icon.name} className={value === icon.name ? "category-icon-option is-selected" : "category-icon-option"} key={icon.name} onClick={() => chooseIcon(icon.name)} role="option" title={icon.label} type="button"><span className="category-icon-option__glyph"><Icon name={icon.name} size={16} /></span><span>{icon.label}</span>{value === icon.name && <span aria-hidden className="category-icon-option__check">✓</span>}</button>)}</div>
      {!visibleIcons.length && <span className="category-icon-picker__empty">No icons match “{query}”. Try a broader word.</span>}
    </div>}
  </div>;
}
