import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest, type AuthPayload } from "../lib/api";
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("retain_token");
    if (!token) { setLoading(false); return; }
    apiRequest<{ user: User }>("/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => localStorage.removeItem("retain_token"))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, loading, error,
    async signIn(email, password) {
      setError(null);
      try { setUser(saveSession(await apiRequest<AuthPayload>("/auth/signin", { method: "POST", body: JSON.stringify({ email, password }) }))); }
      catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to sign in."); throw requestError; }
    },
    async signUp(name, email, password) {
      setError(null);
      try { setUser(saveSession(await apiRequest<AuthPayload>("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) }))); }
      catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to create account."); throw requestError; }
    },
    async signOut() {
      await apiRequest<{ ok: boolean }>("/auth/signout", { method: "POST" }).catch(() => undefined);
      localStorage.removeItem("retain_token"); setUser(null); setError(null);
    },
  }), [error, loading, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
