import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { apiFetch, ApiError } from "../lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type UserDetail = User;

type FormState = {
  username: string;
  email: string;
  role: string;
  password: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

type QuickCreateState = { username: string; email: string; password: string };
type QuickCreateErrors = Partial<Record<keyof QuickCreateState, string>>;

const ROLES = ["Admin", "Editor", "Viewer"];

// ── Validation ────────────────────────────────────────────────────────────────

function validateForm(form: FormState, mode: "create" | "edit"): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.username.trim()) errs.username = "Le username est obligatoire";
  if (form.username.trim().length > 80) errs.username = "Max 80 caractères";
  if (!form.email.trim()) errs.email = "L'email est obligatoire";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Format invalide";
  if (!ROLES.includes(form.role)) errs.role = "Rôle invalide";
  if (mode === "create") {
    if (!form.password.trim()) errs.password = "Le mot de passe est obligatoire";
    else if (form.password.length < 6) errs.password = "Minimum 6 caractères";
  }
  return errs;
}

function validateQuickCreate(form: QuickCreateState): QuickCreateErrors {
  const errs: QuickCreateErrors = {};
  if (!form.username.trim()) errs.username = "Le username est obligatoire";
  if (form.username.trim().length > 80) errs.username = "Max 80 caractères";
  if (!form.email.trim()) errs.email = "L'email est obligatoire";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Format invalide";
  if (!form.password.trim()) errs.password = "Le mot de passe est obligatoire";
  else if (form.password.length < 6) errs.password = "Minimum 6 caractères";
  return errs;
}

// ── Badge rôle ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === "Admin"
      ? "text-wax border-wax/30 bg-wax-soft"
      : role === "Editor"
      ? "text-ink-blue border-ink-blue/30 bg-ink-blue/8"
      : "text-sage border-sage/30 bg-sage/10";

  return (
    <span className={`font-mono text-[10px] tracking-wide px-2 py-0.5 rounded border ${cls}`}>
      {role}
    </span>
  );
}

// ── Composant racine ──────────────────────────────────────────────────────────

export function UsersPage() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <main className="min-h-screen p-6 bg-paper">
        <h1 className="font-heading text-3xl text-ink mb-1">Utilisateurs</h1>
        <p className="text-sm text-ink-3">Accès restreint : auth désactivée (clé Clerk manquante).</p>
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <main className="min-h-screen p-6 bg-paper">
          <h1 className="font-heading text-3xl text-ink mb-1">Utilisateurs</h1>
          <p className="text-sm text-ink-3">Connexion requise pour gérer les utilisateurs.</p>
        </main>
      </SignedOut>
      <SignedIn>
        <UsersInner />
      </SignedIn>
    </>
  );
}

// ── Styles réutilisables ──────────────────────────────────────────────────────

const inputCls =
  "w-full border border-rule rounded-lg bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30";
const selectCls =
  "w-full h-9 rounded-lg border border-rule bg-velin px-3 text-sm text-ink focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30";
const labelCls = "font-mono text-[9.5px] tracking-wide uppercase text-ink-3 block mb-1.5";

// ── Corps principal (connecté) ────────────────────────────────────────────────

function UsersInner() {
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const [users, setUsers]         = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState<string | null>(null);
  const [detail, setDetail]               = useState<UserDetail | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode]                 = useState<"create" | "edit">("create");
  const [form, setForm]                 = useState<FormState>({ username: "", email: "", role: "Editor", password: "" });
  const [formErrors, setFormErrors]     = useState<FieldErrors>({});

  const [adminForm, setAdminForm]       = useState<QuickCreateState>({ username: "", email: "", password: "" });
  const [adminErrors, setAdminErrors]   = useState<QuickCreateErrors>({});
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const [clientForm, setClientForm]     = useState<QuickCreateState>({ username: "", email: "", password: "" });
  const [clientErrors, setClientErrors] = useState<QuickCreateErrors>({});
  const [clientSubmitting, setClientSubmitting] = useState(false);

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedId) ?? null, [users, selectedId]);

  async function refreshList() {
    const list = await apiFetch<User[]>("/users", { cacheTtlMs: 0 });
    setUsers(list);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try { await refreshList(); }
      catch (e) { if (!cancelled) setError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e)); }
      finally   { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedId) { setDetail(null); setDetailError(null); return; }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const d = await apiFetch<UserDetail>(`/users/${selectedId}`, { cacheTtlMs: 0 });
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (cancelled) return;
        setDetailError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e));
        setDetail(null);
      } finally { if (!cancelled) setDetailLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  function resetFormToCreate() {
    setMode("create");
    setForm({ username: "", email: "", role: "Editor", password: "" });
    setFormErrors({});
    setSuccess(null);
    setError(null);
  }

  function startEdit(u: User) {
    setMode("edit");
    setForm({ username: u.username ?? "", email: u.email ?? "", role: u.role ?? "Editor", password: "" });
    setFormErrors({});
    setSuccess(null);
    setError(null);
  }

  async function onSubmit() {
    setSuccess(null); setError(null);
    const errs = validateForm(form, mode);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await apiFetch<User>("/users", { method: "POST", body: { username: form.username.trim(), email: form.email.trim(), role: form.role, password: form.password } });
        setSuccess("Utilisateur créé avec succès");
      } else {
        if (!selectedUser) throw new Error("Aucun utilisateur sélectionné");
        await apiFetch<User>(`/users/${selectedUser.id}`, { method: "PUT", body: { username: form.username.trim(), email: form.email.trim(), role: form.role } });
        setSuccess("Utilisateur modifié avec succès");
      }
      await refreshList();
      resetFormToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) { setSuccess("Hors‑ligne : requête mise en attente."); resetFormToCreate(); return; }
      setError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e));
    } finally { setIsSubmitting(false); }
  }

  async function onDelete(u: User) {
    setSuccess(null); setError(null);
    if (!confirm(`Supprimer l'utilisateur « ${u.username} » ?`)) return;
    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/users/${u.id}`, { method: "DELETE" });
      setSuccess("Utilisateur supprimé");
      if (selectedId === u.id) setSelectedId(null);
      await refreshList();
      resetFormToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) { setSuccess("Hors‑ligne : suppression mise en attente."); if (selectedId === u.id) setSelectedId(null); resetFormToCreate(); return; }
      setError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e));
    } finally { setIsSubmitting(false); }
  }

  async function createWithRole(role: "Admin" | "Viewer", qForm: QuickCreateState) {
    await apiFetch<User>("/users", { method: "POST", body: { username: qForm.username.trim(), email: qForm.email.trim(), role, password: qForm.password } });
  }

  async function onCreateAdmin() {
    setSuccess(null); setError(null);
    const errs = validateQuickCreate(adminForm);
    setAdminErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setAdminSubmitting(true);
    try { await createWithRole("Admin", adminForm); setSuccess("Compte Admin créé."); setAdminForm({ username: "", email: "", password: "" }); setAdminErrors({}); await refreshList(); }
    catch (e) { setError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e)); }
    finally { setAdminSubmitting(false); }
  }

  async function onCreateClient() {
    setSuccess(null); setError(null);
    const errs = validateQuickCreate(clientForm);
    setClientErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setClientSubmitting(true);
    try { await createWithRole("Viewer", clientForm); setSuccess("Compte Client créé."); setClientForm({ username: "", email: "", password: "" }); setClientErrors({}); await refreshList(); }
    catch (e) { setError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e)); }
    finally { setClientSubmitting(false); }
  }

  return (
    <main className="min-h-screen p-6 bg-paper">
      {/* ── En-tête ── */}
      <h1 className="font-heading text-3xl text-ink mb-1">Utilisateurs</h1>
      <p className="text-sm text-ink-3 mb-5">Gestion des comptes et des rôles.</p>

      {loading  && <p className="text-ink-3 text-sm mb-3">Chargement…</p>}
      {error    && <p className="text-crit  text-sm mb-3">{error}</p>}
      {success  && <p className="text-sage  text-sm mb-3">{success}</p>}

      {/* ── Liste + formulaire ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-5 items-start">

        {/* Liste */}
        <div className="bg-velin border border-rule rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-rule">
            <h2 className="font-heading text-lg text-ink">Liste</h2>
            <button
              onClick={() => { setError(null); setSuccess(null); setLoading(true); refreshList().catch((e) => setError(String(e))).finally(() => setLoading(false)); }}
              disabled={loading}
              className="text-sm text-ink-blue hover:underline disabled:opacity-50"
            >
              Rafraîchir
            </button>
          </div>

          {/* En-têtes colonnes */}
          <div className="grid grid-cols-[40px_1.2fr_1.4fr_0.8fr_120px] px-4 py-2.5 border-b border-rule font-mono text-[9.5px] tracking-wide uppercase text-ink-3">
            <span>ID</span>
            <span>Username</span>
            <span>Email</span>
            <span>Rôle</span>
            <span />
          </div>

          {users.length === 0 ? (
            <div className="px-4 py-6 text-center text-ink-3 text-sm">Aucun utilisateur.</div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedId(u.id)}
                className={`grid grid-cols-[40px_1.2fr_1.4fr_0.8fr_120px] px-4 py-3.5 border-b border-rule/60 items-center cursor-pointer transition-colors ${
                  selectedId === u.id ? "bg-wax-soft" : "hover:bg-paper"
                }`}
              >
                <span className="font-mono text-xs text-ink-3">{String(u.id).padStart(2, "0")}</span>
                <span className="font-heading text-[14.5px] text-ink">{u.username}</span>
                <span className="text-[12.5px] text-ink-2 truncate">{u.email}</span>
                <span><RoleBadge role={u.role} /></span>
                <div className="flex gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedId(u.id); startEdit(u); }}
                    disabled={isSubmitting}
                    className="text-[11px] text-ink-blue border border-ink-blue/30 rounded px-2 py-1 hover:bg-ink-blue/10 disabled:opacity-50"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(u).catch(() => undefined); }}
                    disabled={isSubmitting}
                    className="text-[11px] text-wax border border-wax/35 rounded px-2 py-1 hover:bg-wax-soft disabled:opacity-50"
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Détail utilisateur sélectionné */}
          {selectedId && (
            <div className="px-4 py-4 border-t border-rule bg-paper/60">
              <h3 className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-2">Détail</h3>
              {detailLoading ? (
                <p className="text-sm text-ink-3">Chargement…</p>
              ) : detailError ? (
                <p className="text-sm text-crit">{detailError}</p>
              ) : detail ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  <div><span className="text-ink-3">Username : </span><span className="text-ink font-medium">{detail.username}</span></div>
                  <div><span className="text-ink-3">Email : </span><span className="text-ink">{detail.email}</span></div>
                  <div><span className="text-ink-3">Rôle : </span><RoleBadge role={detail.role} /></div>
                  <div><span className="text-ink-3">Actif : </span><span className={detail.isActive ? "text-sage" : "text-crit"}>{detail.isActive ? "Oui" : "Non"}</span></div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Formulaire créer / modifier */}
        <div className="bg-velin border border-rule rounded-2xl p-5">
          <div className="font-heading text-lg text-ink mb-4">
            {mode === "create" ? "Nouvel utilisateur" : "Modifier"}
          </div>
          <div className="space-y-3.5">
            <div>
              <label className={labelCls}>Username</label>
              <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="ex : admin" className={inputCls} />
              {formErrors.username && <p className="text-[11px] text-crit mt-1">{formErrors.username}</p>}
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="admin@nomina.app" className={inputCls} />
              {formErrors.email && <p className="text-[11px] text-crit mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <label className={labelCls}>Rôle</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={selectCls}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {formErrors.role && <p className="text-[11px] text-crit mt-1">{formErrors.role}</p>}
            </div>
            {mode === "create" && (
              <div>
                <label className={labelCls}>Mot de passe</label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Minimum 6 caractères" className={inputCls} />
                {formErrors.password && <p className="text-[11px] text-crit mt-1">{formErrors.password}</p>}
              </div>
            )}
            <div className="flex gap-2.5 pt-1">
              <button onClick={() => onSubmit().catch(() => undefined)} disabled={isSubmitting} className="flex-1 bg-wax hover:bg-wax-hover text-velin rounded-lg py-2.5 text-[13.5px] font-semibold transition-colors disabled:opacity-50">
                {isSubmitting ? "En cours…" : mode === "create" ? "Créer" : "Enregistrer"}
              </button>
              <button onClick={resetFormToCreate} disabled={isSubmitting} className="border border-rule-2 text-ink rounded-lg px-4 py-2.5 text-[13.5px] hover:bg-paper transition-colors disabled:opacity-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Création rapide ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <QuickCreateCard
          title="Créer un Admin"
          placeholder={{ username: "admin_nomina", email: "admin@nomina.app" }}
          form={adminForm}
          errors={adminErrors}
          submitting={adminSubmitting}
          disabled={isSubmitting}
          onChange={(field, val) => setAdminForm((s) => ({ ...s, [field]: val }))}
          onSubmit={() => onCreateAdmin().catch(() => undefined)}
          labelCls={labelCls}
          inputCls={inputCls}
        />
        <QuickCreateCard
          title="Créer un Client"
          placeholder={{ username: "client_nomina", email: "client@nomina.app" }}
          form={clientForm}
          errors={clientErrors}
          submitting={clientSubmitting}
          disabled={isSubmitting}
          onChange={(field, val) => setClientForm((s) => ({ ...s, [field]: val }))}
          onSubmit={() => onCreateClient().catch(() => undefined)}
          labelCls={labelCls}
          inputCls={inputCls}
        />
      </div>
    </main>
  );
}

// ── QuickCreateCard ───────────────────────────────────────────────────────────

function QuickCreateCard({
  title,
  placeholder,
  form,
  errors,
  submitting,
  disabled,
  onChange,
  onSubmit,
  labelCls,
  inputCls,
}: {
  title: string;
  placeholder: { username: string; email: string };
  form: QuickCreateState;
  errors: QuickCreateErrors;
  submitting: boolean;
  disabled: boolean;
  onChange: (field: keyof QuickCreateState, val: string) => void;
  onSubmit: () => void;
  labelCls: string;
  inputCls: string;
}) {
  return (
    <div className="bg-velin border border-rule rounded-2xl p-5">
      <div className="font-heading text-lg text-ink mb-4">{title}</div>
      <div className="space-y-3.5">
        <div>
          <label className={labelCls}>Username</label>
          <input value={form.username} onChange={(e) => onChange("username", e.target.value)} placeholder={placeholder.username} className={inputCls} />
          {errors.username && <p className="text-[11px] text-crit mt-1">{errors.username}</p>}
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input value={form.email} onChange={(e) => onChange("email", e.target.value)} placeholder={placeholder.email} className={inputCls} />
          {errors.email && <p className="text-[11px] text-crit mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className={labelCls}>Mot de passe</label>
          <input type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} placeholder="Minimum 6 caractères" className={inputCls} />
          {errors.password && <p className="text-[11px] text-crit mt-1">{errors.password}</p>}
        </div>
        <button
          onClick={onSubmit}
          disabled={submitting || disabled}
          className="w-full bg-wax hover:bg-wax-hover text-velin rounded-lg py-2.5 text-[13.5px] font-semibold transition-colors disabled:opacity-50"
        >
          {submitting ? "Création…" : title}
        </button>
      </div>
    </div>
  );
}
