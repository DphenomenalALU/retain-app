import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { setSidebarOpen } from "../../store/slices/uiSlice";
import { Icon } from "../ui/Icon";
const titles: Record<string, string> = { "/": "Overview", "/expenses": "Expenses", "/budgets": "Budgets", "/admin": "Admin space" };
export default function Topbar() {
  const location = useLocation(); const navigate = useNavigate(); const dispatch = useDispatch(); const { user, signOut } = useAuth();
  return <header className="topbar"><button aria-label="Open navigation" className="mobile-menu" onClick={() => dispatch(setSidebarOpen(true))} type="button"><Icon name="menu" /></button><div className="breadcrumb"><span>Retain</span><Icon name="arrow" size={13} /><strong>{titles[location.pathname] ?? "Retain"}</strong></div><div className="topbar-actions"><button aria-label="Notifications" className="icon-button" type="button"><Icon name="bell" size={19} /><span className="notification-dot" /></button><button className="profile-button" onClick={() => navigate("/budgets")} type="button"><span className="avatar">MI</span><span className="profile-copy"><strong>{user?.name ?? "Guest"}</strong><small>Personal account</small></span><span className="profile-chevron">⌄</span></button>{user && <button className="signout-button" onClick={signOut} type="button">Sign out</button>}</div></header>;
}
