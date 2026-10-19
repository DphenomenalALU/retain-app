import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/Icon";
import BrandLockup from "../components/ui/BrandLockup";

export default function SignInPage() {
  const { user, error: authError, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") await signUp(name, email, password);
      else await signIn(email, password);
      navigate("/");
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="auth-page">
    <section aria-labelledby="auth-heading" className="auth-card">
      <BrandLockup />
      <div className="auth-card__content">
        <div className="auth-card__intro">
          <p className="eyebrow">{mode === "signin" ? "Expenses & budgets" : "A clearer starting point"}</p>
          <h1 id="auth-heading">{mode === "signin" ? "Welcome back." : "Create your ledger."}</h1>
          <p className="page-lede">{mode === "signin" ? "Pick up where your spending left off." : "Keep everyday spending, budgets, and context in one place."}</p>
        </div>
        <form onSubmit={submit}>
          {mode === "signup" && <label>Name<input autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} /></label>}
          <label>Email<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          <label>Password<input autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          {authError && <p className="form-error" role="alert">{authError}</p>}
          <button className="button button--primary button--full" disabled={submitting} type="submit">{submitting ? "Working…" : mode === "signin" ? "Sign in" : "Create account"} <Icon name="arrow" size={17} /></button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setPassword(""); }} type="button">{mode === "signin" ? "New to Retain? Create an account" : "Already have an account? Sign in"}</button>
      </div>
    </section>
  </main>;
}
