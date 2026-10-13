import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setSidebarOpen } from "../../store/slices/uiSlice";
import { Icon } from "../ui/Icon";
const navItems = [{ to: "/", label: "Overview", icon: "grid" as const }, { to: "/expenses", label: "Expenses", icon: "receipt" as const }, { to: "/budgets", label: "Budgets", icon: "wallet" as const }];
export default function Sidebar() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const closeOnMobile = () => dispatch(setSidebarOpen(false));
  return <aside className={`sidebar${sidebarOpen ? " is-open" : ""}`}><div className="brand-lockup"><div className="brand-mark">R</div><div><strong>retain</strong><span>personal finance</span></div></div><div className="sidebar-section-label">Workspace</div><nav aria-label="Main navigation" className="main-nav">{navItems.map((item) => <NavLink className={({ isActive }) => isActive ? "nav-link nav-link--active" : "nav-link"} end={item.to === "/"} key={item.to} onClick={closeOnMobile} to={item.to}><Icon name={item.icon} size={19} /><span>{item.label}</span></NavLink>)}{user?.role === "admin" && <NavLink className={({ isActive }) => isActive ? "nav-link nav-link--active" : "nav-link"} onClick={closeOnMobile} to="/admin"><Icon name="shield" size={19} /><span>Admin space</span></NavLink>}</nav><div className="sidebar-spacer" /><div className="sidebar-note"><span className="sidebar-note__orb" /><div><strong>Small steps add up.</strong><p>Keep an eye on what matters this month.</p></div></div><div className="sidebar-footer">v0.1 · Day 1 foundation</div></aside>;
}
