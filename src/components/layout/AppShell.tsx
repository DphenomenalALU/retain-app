import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
export default function AppShell({ children }: { children: ReactNode }) { return <div className="app-frame"><Sidebar /><div className="app-main"><Topbar /><main className="page-content">{children}</main></div></div>; }
