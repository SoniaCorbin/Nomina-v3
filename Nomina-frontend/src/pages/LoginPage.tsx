import { useClerk, useSignIn, useUser } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { getClerkErrorMessage } from "../lib/error-utils";
import logoDark from "../../assets/logoSombre.jpg";

export function LoginPage() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const clerk = useClerk();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [accountType, setAccountType] = useState<"client" | "admin">("client");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(
    () => !pending && !isSignedIn && email.trim().length > 0 && password.trim().length > 0,
    [email, isSignedIn, password, pending],
  );

  useEffect(() => {
    if (clerkEnabled && isSignedIn) navigate("/dashboard", { replace: true });
  }, [clerkEnabled, isSignedIn, navigate]);

  async function handleSubmit() {
    if (!clerkEnabled || isSignedIn || !isLoaded || !signIn) return;
    setError(null);
    setPending(true);

    try {
      const res = await signIn.create({ identifier: email.trim(), password });

      if (res.status === "complete") {
        await setActive?.({ session: res.createdSessionId });

        if (accountType === "admin") {
          const isAdmin = await ensureAdminAccess();
          if (!isAdmin) {
            await clerk.signOut().catch(() => undefined);
            setError("Droits admin insuffisants. Vérifie ton compte.");
            return;
          }
        }

        navigate(accountType === "admin" ? "/admin" : "/dashboard", { replace: true });
        return;
      }

      setError("Une vérification supplémentaire est requise (ex. 2FA).");
    } catch (err) {
      setError(getClerkErrorMessage(err, "Impossible de se connecter."));
    } finally {
      setPending(false);
    }
  }

  async function ensureAdminAccess(): Promise<boolean> {
    for (let i = 0; i < 15; i++) {
      try {
        const me = await apiFetch<{ isAdmin: boolean }>("/auth/me", { cacheTtlMs: 0 });
        return me.isAdmin;
      } catch {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    return false;
  }

  async function startOAuth(strategy: "oauth_google" | "oauth_github") {
    if (!clerkEnabled || !isLoaded || !signIn) return;
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: accountType === "admin" ? "/admin" : "/dashboard",
      });
    } catch (err) {
      setError(getClerkErrorMessage(err, "Impossible de démarrer la connexion OAuth."));
    }
  }

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      {/* ── Panneau gauche — marque ── */}
      <div className="hidden md:flex flex-col justify-between bg-ink px-10 py-12 min-h-[600px]">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoDark} alt="Nomina" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-heading text-lg tracking-[0.16em] text-paper pl-[0.16em]">
            NOMINA
          </span>
        </Link>

        <div>
          <h2 className="font-heading text-4xl leading-tight text-paper">
            Le monde attend<br />
            son <em className="italic text-wax">premier nom.</em>
          </h2>
          <p className="text-ink-3 text-sm mt-4 max-w-[36ch]">
            Rejoins les conteurs qui peuplent leurs univers en quelques secondes.
          </p>
        </div>

        <div className="font-mono text-[10px] tracking-wide uppercase text-ink-3">
          Personnages · Lieux · Créatures · Récits
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex flex-col justify-center bg-paper px-8 md:px-12 py-12">
        <div className="max-w-sm mx-auto w-full">
          {/* Logo mobile */}
          <div className="md:hidden flex items-center gap-2.5 mb-8">
            <img src={logoDark} alt="Nomina" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-heading text-lg tracking-[0.16em] text-ink">NOMINA</span>
          </div>

          {/* Tabs Connexion / Inscription */}
          <div className="inline-flex bg-paper-2 rounded-lg p-1 mb-7">
            <span className="text-[13px] px-4 py-1.5 rounded-md bg-velin text-ink font-semibold shadow-sm">
              Connexion
            </span>
            <Link
              to="/register"
              className="text-[13px] px-4 py-1.5 rounded-md text-ink-3 hover:text-ink transition-colors"
            >
              Inscription
            </Link>
          </div>

          {/* Type de compte */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAccountType("client")}
              className={`flex-1 text-[12px] py-2 rounded-lg border transition-colors ${
                accountType === "client"
                  ? "border-wax bg-wax-soft text-wax font-semibold"
                  : "border-rule bg-transparent text-ink-3"
              }`}
            >
              Client
            </button>
            <button
              onClick={() => setAccountType("admin")}
              className={`flex-1 text-[12px] py-2 rounded-lg border transition-colors ${
                accountType === "admin"
                  ? "border-wax bg-wax-soft text-wax font-semibold"
                  : "border-rule bg-transparent text-ink-3"
              }`}
            >
              Administrateur
            </button>
          </div>

          {clerkEnabled ? (
            <div className="space-y-4">
              {error && <p className="text-sm text-crit">{error}</p>}

              {/* OAuth */}
              <div className="flex gap-2">
                <button
                  onClick={() => startOAuth("oauth_google").catch(() => undefined)}
                  disabled={pending}
                  className="flex-1 border border-rule rounded-lg py-2.5 text-[13px] text-ink hover:bg-paper-2 transition-colors disabled:opacity-50"
                >
                  Google
                </button>
                <button
                  onClick={() => startOAuth("oauth_github").catch(() => undefined)}
                  disabled={pending}
                  className="flex-1 border border-rule rounded-lg py-2.5 text-[13px] text-ink hover:bg-paper-2 transition-colors disabled:opacity-50"
                >
                  GitHub
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-rule" />
                <span className="text-[11px] text-ink-3 uppercase tracking-wide">ou</span>
                <div className="h-px flex-1 bg-rule" />
              </div>

              {/* Email */}
              <div>
                <label className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 block mb-1.5">
                  Courriel
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse courriel"
                  className="w-full border border-rule rounded-lg bg-velin px-3.5 py-3 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30"
                />
              </div>

              {/* Mot de passe */}
              <div>
                <label className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 block mb-1.5">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full border border-rule rounded-lg bg-velin px-3.5 py-3 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30"
                />
              </div>

              {/* Submit */}
              <button
                onClick={() => handleSubmit().catch(() => undefined)}
                disabled={!canSubmit}
                className="w-full bg-wax hover:bg-wax-hover text-velin rounded-lg py-3 text-[15px] font-semibold transition-colors disabled:opacity-50"
              >
                {pending
                  ? "Connexion…"
                  : accountType === "admin"
                    ? "Accéder à l'espace admin"
                    : "Se connecter"}
              </button>

              <p className="text-center text-[13px] text-ink-3 mt-4">
                Pas encore de compte ?{" "}
                <Link to="/register" className="text-wax font-semibold hover:underline">
                  Créer un compte
                </Link>
              </p>
            </div>
          ) : (
            <div className="text-ink-2 text-sm">
              <p>L'authentification est désactivée.</p>
              <p className="text-ink-3 text-xs mt-1">
                Ajoute <code className="font-mono bg-paper-2 px-1 py-0.5 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> pour activer.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}