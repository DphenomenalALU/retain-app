import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { demoUser } from "../data/mockData";
import type { User } from "../types/retain";

type AuthContextValue = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(demoUser);
  const value = useMemo<AuthContextValue>(() => ({
    user,
    async signIn() { setUser(demoUser); },
    async signUp(name, email) { setUser({ ...demoUser, name, email, role: "user" }); },
    signOut() { setUser(null); },
  }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
