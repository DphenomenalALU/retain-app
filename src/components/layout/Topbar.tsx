import { NavLink, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { setSidebarOpen } from "../../store/slices/uiSlice";
import { Icon } from "../ui/Icon";
import NotificationsPopover from "./NotificationsPopover";
import ProfileMenu from "./ProfileMenu";
import SearchCommand from "./SearchCommand";

const titles: Record<string, string> = { "/": "Overview", "/expenses": "Expenses", "/budgets": "Budgets", "/admin": "Admin space" };
const tabs = [{ to: "/", label: "Overview" }, { to: "/expenses", label: "Expenses" }, { to: "/budgets", label: "Budgets" }];

export default function Topbar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const title = titles[location.pathname] ?? "Retain";

  return <header className="topbar">
    <div className="topbar-main">
      <div className="topbar-title-row"><button aria-label="Open navigation" className="mobile-menu" onClick={() => dispatch(setSidebarOpen(true))} type="button"><Icon name="menu" size={15} /></button><h1>{title}</h1></div>
      <div className="topbar-actions"><SearchCommand /><NotificationsPopover />{user && <ProfileMenu />}</div>
    </div>
    <nav aria-label="Workspace views" className="topbar-tabs">{tabs.map((tab) => <NavLink className={({ isActive }) => isActive ? "topbar-tab topbar-tab--active" : "topbar-tab"} end={tab.to === "/"} key={tab.to} to={tab.to}>{tab.label}</NavLink>)}{user?.role === "admin" && <NavLink className={({ isActive }) => isActive ? "topbar-tab topbar-tab--active" : "topbar-tab"} to="/admin">Admin</NavLink>}</nav>
  </header>;
}
