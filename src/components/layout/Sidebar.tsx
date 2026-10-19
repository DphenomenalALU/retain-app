import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setSidebarOpen } from "../../store/slices/uiSlice";
import { Icon } from "../ui/Icon";
import BrandLockup from "../ui/BrandLockup";

const navItems = [
  { to: "/", label: "Overview", icon: "chart" as const },
  { to: "/expenses", label: "Expenses", icon: "receipt" as const },
  { to: "/budgets", label: "Budgets", icon: "wallet" as const },
];

export default function Sidebar() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const closeOnMobile = () => dispatch(setSidebarOpen(false));

  return <>
    <button aria-label="Close navigation" className={"sidebar-backdrop" + (sidebarOpen ? " is-visible" : "")} onClick={closeOnMobile} type="button" />
    <aside className={"sidebar" + (sidebarOpen ? " is-open" : "")}>
      <BrandLockup onDark />
      <div className="sidebar-section-label">Workspace</div>
      <nav aria-label="Main navigation" className="main-nav">
        {navItems.map((item) => <NavLink className={({ isActive }) => isActive ? "nav-link nav-link--active" : "nav-link"} end={item.to === "/"} key={item.to} onClick={closeOnMobile} to={item.to}><Icon name={item.icon} size={19} /><span>{item.label}</span></NavLink>)}
        {user?.role === "admin" && <NavLink className={({ isActive }) => isActive ? "nav-link nav-link--active" : "nav-link"} onClick={closeOnMobile} to="/admin"><Icon name="shield" size={19} /><span>Admin space</span></NavLink>}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-footer"><div className="sidebar-footer__identity"><span className="sidebar-footer__orb" /><div><strong>{user?.role === "admin" ? "Admin workspace" : "Personal ledger"}</strong><span>{user?.name ?? "Signed in"}</span></div></div><strong>Retain · 2026</strong></div>
    </aside>
  </>;
}
