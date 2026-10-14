import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import DashboardPage from "./pages/DashboardPage";
import ExpensesPage from "./pages/ExpensesPage";
import BudgetsPage from "./pages/BudgetsPage";
import AdminPage from "./pages/AdminPage";
import SignInPage from "./pages/SignInPage";
import NotFoundPage from "./pages/NotFoundPage";

function ProtectedLayout() {
  const { user, loading } = useAuth();
  if (loading) return <main className="loading-page"><span className="loading-orb" />Loading your workspace…</main>;
  if (!user) return <Navigate to="/sign-in" replace />;
  return <AppShell><Outlet /></AppShell>;
}

function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return <AdminPage />;
}

function App() {
  return <Routes>
    <Route path="/sign-in" element={<SignInPage />} />
    <Route element={<ProtectedLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="expenses" element={<ExpensesPage />} />
      <Route path="budgets" element={<BudgetsPage />} />
      <Route path="admin" element={<AdminRoute />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}

export default App;
