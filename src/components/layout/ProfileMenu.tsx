import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Icon } from "../ui/Icon";

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProfileMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => { if (!anchorRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  if (!user) return null;

  return <div className="profile-menu-anchor" ref={anchorRef}>
    <button aria-expanded={open} aria-haspopup="menu" aria-label={`Open profile for ${user.name}`} className={`profile-button${open ? " profile-button--open" : ""}`} onClick={() => setOpen((current) => !current)} ref={triggerRef} type="button"><span className="avatar">{initials(user.name)}</span><span className="profile-copy"><strong>{user.name}</strong><small>Personal account</small></span><Icon className="profile-chevron" name="chevron" size={13} /></button>
    {open && <div aria-label="Account menu" className="profile-menu" role="menu">
      <div className="profile-menu__identity"><span className="avatar avatar--large">{initials(user.name)}</span><div><strong>{user.name}</strong><span>{user.email}</span></div></div>
      <div className="profile-menu__divider" />
      <div className="profile-menu__account"><span>Account</span><strong>{user.role === "admin" ? "Administrator" : "Personal ledger"}</strong></div>
      <div className="profile-menu__divider" />
      <button className="profile-menu__item profile-menu__item--danger" onClick={() => { setOpen(false); triggerRef.current?.focus(); void signOut(); }} role="menuitem" type="button"><Icon name="logout" size={14} />Sign out</button>
    </div>}
  </div>;
}
