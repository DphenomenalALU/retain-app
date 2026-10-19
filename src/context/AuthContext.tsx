import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest, ApiError, AUTH_EXPIRED_EVENT, type AuthPayload } from "../lib/api";
import { useAppDispatch } from "../store/hooks";
import { resetExpenses } from "../store/slices/expensesSlice";
import { resetBudget } from "../store/slices/budgetSlice";
import type { User } from "../types/retain";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveSession(payload: AuthPayload) {
  localStorage.setItem("retain_token", payload.token);
  return payload.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearPrivateState = () => {
    dispatch(resetExpenses());
    dispatch(resetBudget());
  };

  useEffect(() => {
    let active = true;
    const onExpired = () => {
      if (!active) return;
      localStorage.removeItem("retain_token");
      setUser(null);
      setError("Your session expired. Please sign in again.");
      clearPrivateState();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    const token = localStorage.getItem("retain_token");
    if (!token) { setLoading(false); return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired); }
    apiRequest<{ user: User }>("/auth/me")
      .then(({ user: currentUser }) => { if (active && localStorage.getItem("retain_token") === token) setUser(currentUser); })
      .catch((requestError) => { if (!active || localStorage.getItem("retain_token") !== token) return; if (requestError instanceof ApiError && requestError.status === 401) onExpired(); else setError("Unable to verify your session."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired); };
  }, [dispatch]);

  const value = useMemo<AuthContextValue>(() => ({
    user, loading, error,
    async signIn(email, password) {
      setError(null);
      try { const payload = await apiRequest<AuthPayload>("/auth/signin", { method: "POST", body: JSON.stringify({ email, password }) }); clearPrivateState(); setUser(saveSession(payload)); }
      catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to sign in."); throw requestError; }
    },
    async signUp(name, email, password) {
      setError(null);
      try { const payload = await apiRequest<AuthPayload>("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) }); clearPrivateState(); setUser(saveSession(payload)); }
      catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to create account."); throw requestError; }
    },
    async signOut() {
      await apiRequest<{ ok: boolean }>("/auth/signout", { method: "POST" }).catch(() => undefined);
      localStorage.removeItem("retain_token"); clearPrivateState(); setUser(null); setError(null);
    },
  }), [dispatch, error, loading, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
