import { useSignUp, useUser } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { getClerkErrorMessage, getClerkRetryAfterSeconds, isClerkAlreadyVerifiedError } from "../lib/error-utils";
import logoDark from "../../assets/logoSombre.jpg";

type MissingRequirementsAttempt = { missingFields?: unknown; unverifiedFields?: unknown };

export function RegisterPage() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [accountType, setAccountType] = useState<"client" | "admin">("client");

  const [step, setStep] = useState<"form" | "verify-email">("form");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [emailCode, setEmailCode] = useState("");

  function normalizeEmailCode(raw: string) { return raw.replace(/[\s-]/g, "").trim(); }

  function buildUsername(): string {
    const pref = username.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9_-]+/g, "").slice(0, 24);
    if (pref.length >= 3) return pref;
    const raw = `${firstName}-${lastName}`.trim() || email.trim().split("@")[0] || "nomina-user";
    const slug = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9_-]+/g, "").slice(0, 24);
    const base = slug.length >= 3 ? slug : "nomina-user";
    return `${base}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const canSubmit = useMemo(() => {
    if (pending || isSignedIn) return false;
    if (step === "verify-email") return normalizeEmailCode(emailCode).length >= 4;
    return firstName.trim().length > 0 && lastName.trim().length > 0
      && email.trim().length > 0 && password.trim().length >= 8
      && passwordConfirm.trim().length >= 8;
  }, [email, emailCode, firstName, isSignedIn, lastName, password, passwordConfirm, pending, step]);

  useEffect(() => {
    if (clerkEnabled && isSignedIn) navigate("/dashboard", { replace: true });
  }, [clerkEnabled, isSignedIn, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  function getAttemptReqs(a: MissingRequirementsAttempt): string[] {
    const m = Array.isArray(a.missingFields) ? a.missingFields : [];
    const u = Array.isArray(a.unverifiedFields) ? a.unverifiedFields : [];
    return [...m, ...u].filter((v): v is string => typeof v === "string");
  }

  async function maybeSubmitAdminRequest() {
    if (accountType !== "admin") return;
    const name = `${firstName} ${lastName}`.trim();
    await apiFetch("/auth/admin-request", {
      method: "POST",
      body: { email: email.trim(), username: name || email.trim().split("@")[0] },
    });
  }

  async function completeAlreadyVerifiedFlow() {
    if (signUp?.createdSessionId) {
      await setActive?.({ session: signUp.createdSessionId });
      try { await maybeSubmitAdminRequest(); } catch { /* silent */ }
      navigate("/dashboard", { replace: true });
      return;
    }
    setInfo("Adresse déjà vérifiée. Connecte-toi pour terminer.");
    navigate("/login", { replace: true });
  }

  async function handleSubmit() {
    if (!clerkEnabled || isSignedIn || !isLoaded || !signUp) return;
    setError(null); setInfo(null);
    if (step === "form" && password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas."); return;
    }
    setPending(true);
    try {
      if (step === "form") {
        const uname = buildUsername();
        const ph = phone.trim();
        await signUp.create({
          emailAddress: email.trim(), password, username: uname,
          firstName: firstName.trim(), lastName: lastName.trim(),
          ...(ph.length > 0 ? { phoneNumber: ph } : {}),
        });
        try {
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setStep("verify-email");
          setInfo(accountType === "admin"
            ? "Code envoyé. Après validation, la demande admin sera soumise."
            : "Code de vérification envoyé par courriel.");
          return;
        } catch {
          if (signUp.status === "complete") {
            await maybeSubmitAdminRequest();
            await setActive?.({ session: signUp.createdSessionId });
            navigate("/dashboard", { replace: true }); return;
          }
          setError("Inscription créée, vérification additionnelle requise."); return;
        }
      }
      const code = normalizeEmailCode(emailCode);
      if (!code) { setError("Code requis."); return; }
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === "complete") {
        await setActive?.({ session: attempt.createdSessionId });
        try { await maybeSubmitAdminRequest(); } catch {
          setInfo("Compte vérifié. La demande admin n'a pas pu être envoyée automatiquement.");
        }
        navigate("/dashboard", { replace: true }); return;
      }
      if (attempt.status === "missing_requirements") {
        const d = getAttemptReqs(attempt).join(", ");
        setError(d ? `Exigences manquantes (${d}).` : "Exigences Clerk manquantes."); return;
      }
      setError(`Vérification incomplète (${attempt.status}). Renvoie un code.`);
    } catch (err) {
      if (step === "verify-email" && isClerkAlreadyVerifiedError(err)) {
        await completeAlreadyVerifiedFlow(); return;
      }
      setError(getClerkErrorMessage(err, step === "form" ? "Impossible de créer le compte." : "Code invalide ou expiré."));
    } finally { setPending(false); }
  }

  async function resendEmailCode() {
    if (!clerkEnabled || !isLoaded || !signUp || resendCooldown > 0) return;
    setError(null); setInfo(null); setPending(true);
    try {
      if (!signUp.emailAddress) {
        const uname = buildUsername(); const ph = phone.trim();
        await signUp.create({
          emailAddress: email.trim(), password, username: uname,
          firstName: firstName.trim(), lastName: lastName.trim(),
          ...(ph.length > 0 ? { phoneNumber: ph } : {}),
        });
      }
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setInfo("Nouveau code envoyé."); setResendCooldown(30);
    } catch (err) {
      if (isClerkAlreadyVerifiedError(err)) { await completeAlreadyVerifiedFlow(); return; }
      const r = getClerkRetryAfterSeconds(err); if (r) setResendCooldown(r);
      setError(getClerkErrorMessage(err, "Impossible de renvoyer le code."));
    } finally { setPending(false); }
  }

  const inputCls = "w-full border border-rule rounded-lg bg-velin px-3.5 py-3 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30";
  const labelCls = "font-mono text-[9.5px] tracking-wide uppercase text-ink-3 block mb-1.5";

  return (
    <main className="min-h-screen grid md:grid-cols-2">
      {/* ── Panneau gauche — marque ── */}
      <div className="hidden md:flex flex-col justify-between bg-ink px-10 py-12 min-h-[600px]">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logoDark} alt="Nomina" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-heading text-lg tracking-[0.16em] text-paper pl-[0.16em]">NOMINA</span>
        </Link>
        <div>
          <h2 className="font-heading text-4xl leading-tight text-paper">
            Ton univers<br />commence <em className="italic text-wax">ici.</em>
          </h2>
          <p className="text-ink-3 text-sm mt-4 max-w-[36ch]">
            Crée un compte et commence à peupler tes mondes en quelques secondes.
          </p>
        </div>
        <div className="font-mono text-[10px] tracking-wide uppercase text-ink-3">
          Personnages · Lieux · Créatures · Récits
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex flex-col justify-center bg-paper px-8 md:px-12 py-10 overflow-y-auto">
        <div className="max-w-sm mx-auto w-full">
          {/* Logo mobile */}
          <div className="md:hidden flex items-center gap-2.5 mb-8">
            <img src={logoDark} alt="Nomina" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-heading text-lg tracking-[0.16em] text-ink">NOMINA</span>
          </div>

          {/* Tabs */}
          <div className="inline-flex bg-paper-2 rounded-lg p-1 mb-6">
            <Link to="/login" className="text-[13px] px-4 py-1.5 rounded-md text-ink-3 hover:text-ink transition-colors">
              Connexion
            </Link>
            <span className="text-[13px] px-4 py-1.5 rounded-md bg-velin text-ink font-semibold shadow-sm">
              Inscription
            </span>
          </div>

          {/* Type de compte */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setAccountType("client")}
              disabled={pending || step === "verify-email"}
              className={`flex-1 text-[12px] py-2 rounded-lg border transition-colors ${
                accountType === "client" ? "border-wax bg-wax-soft text-wax font-semibold" : "border-rule text-ink-3"
              }`}
            >
              Client
            </button>
            <button
              onClick={() => setAccountType("admin")}
              disabled={pending || step === "verify-email"}
              className={`flex-1 text-[12px] py-2 rounded-lg border transition-colors ${
                accountType === "admin" ? "border-wax bg-wax-soft text-wax font-semibold" : "border-rule text-ink-3"
              }`}
            >
              Administrateur
            </button>
          </div>

          {accountType === "admin" && step === "form" && (
            <p className="text-xs text-ink-3 mb-4">
              Le compte sera créé normalement. L'accès admin restera en attente jusqu'à approbation.
            </p>
          )}

          {clerkEnabled ? (
            <div className="space-y-3.5">
              {error && <p className="text-sm text-crit">{error}</p>}
              {info && <p className="text-sm text-sage">{info}</p>}

              {step === "form" ? (
                <>
                  <div>
                    <label className={labelCls}>Nom d'utilisateur</label>
                    <input className={inputCls} value={username} onChange={e => setUsername(e.target.value)} placeholder="Ex: luna.noctis (optionnel)" />
                    <p className="text-[11px] text-ink-3 mt-1">Laisse vide pour génération automatique.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Prénom</label>
                      <input className={inputCls} value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Nom</label>
                      <input className={inputCls} value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Courriel</label>
                    <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Adresse courriel" />
                  </div>
                  <div>
                    <label className={labelCls}>Téléphone</label>
                    <input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 555 5555 (optionnel)" />
                  </div>
                  <div>
                    <label className={labelCls}>Mot de passe</label>
                    <input className={inputCls} type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    <p className="text-[11px] text-ink-3 mt-1">Minimum 8 caractères.</p>
                  </div>
                  <div>
                    <label className={labelCls}>Confirmation</label>
                    <input className={inputCls} type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
                    {passwordConfirm.length > 0 && password !== passwordConfirm && (
                      <p className="text-[11px] text-crit mt-1">Les mots de passe ne correspondent pas.</p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label className={labelCls}>Code reçu par courriel</label>
                  <input className={inputCls} value={emailCode} onChange={e => setEmailCode(e.target.value)} inputMode="numeric" />
                  <p className="text-[11px] text-ink-3 mt-1">Vérifie ta boîte courriel (et le dossier spam).</p>
                  <button
                    className="mt-3 text-sm text-ink-blue hover:underline disabled:opacity-50"
                    onClick={() => resendEmailCode().catch(() => undefined)}
                    disabled={pending || resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer le code"}
                  </button>
                </div>
              )}

              <button
                onClick={() => handleSubmit().catch(() => undefined)}
                disabled={!canSubmit}
                className="w-full bg-wax hover:bg-wax-hover text-velin rounded-lg py-3 text-[15px] font-semibold transition-colors disabled:opacity-50"
              >
                {pending ? "En cours…" : step === "form" ? "Créer le compte" : "Valider le code"}
              </button>

              {step === "form" && (
                <p className="text-center text-[13px] text-ink-3">
                  Compte existant ? <Link to="/login" className="text-wax font-semibold hover:underline">Se connecter</Link>
                </p>
              )}
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