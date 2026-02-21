import { useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { apiFetch, ApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

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

type QuickCreateState = {
  username: string;
  email: string;
  password: string;
};

type QuickCreateErrors = Partial<Record<keyof QuickCreateState, string>>;

const ROLES = ["Admin", "Editor", "Viewer"];

function validateForm(form: FormState, mode: "create" | "edit"): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.username.trim()) errs.username = "Le username est obligatoire";
  if (form.username.trim().length > 80) errs.username = "Le username est trop long (max 80)";

  if (!form.email.trim()) errs.email = "L'email est obligatoire";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Format d'email invalide";

  if (!ROLES.includes(form.role)) errs.role = "Rôle invalide";

  if (mode === "create") {
    if (!form.password.trim()) errs.password = "Le mot de passe est obligatoire";
    else if (form.password.length < 6) errs.password = "Le mot de passe doit contenir au moins 6 caractères";
  }

  return errs;
}

function validateQuickCreate(form: QuickCreateState): QuickCreateErrors {
  const errs: QuickCreateErrors = {};
  if (!form.username.trim()) errs.username = "Le username est obligatoire";
  if (form.username.trim().length > 80) errs.username = "Le username est trop long (max 80)";

  if (!form.email.trim()) errs.email = "L'email est obligatoire";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Format d'email invalide";

  if (!form.password.trim()) errs.password = "Le mot de passe est obligatoire";
  else if (form.password.length < 6) errs.password = "Le mot de passe doit contenir au moins 6 caractères";

  return errs;
}

export function UsersPage() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-3xl font-semibold mb-2">Utilisateurs</h1>
        <p className="opacity-80">Accès restreint: auth désactivée (clé Clerk manquante).</p>
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <main className="min-h-screen p-6">
          <h1 className="text-3xl font-semibold mb-2">Utilisateurs</h1>
          <p className="opacity-80">Connecte-toi pour gérer les utilisateurs.</p>
        </main>
      </SignedOut>
      <SignedIn>
        <UsersInner />
      </SignedIn>
    </>
  );
}

function UsersInner() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const [form, setForm] = useState<FormState>({ username: "", email: "", role: "Editor", password: "" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  const [adminForm, setAdminForm] = useState<QuickCreateState>({ username: "", email: "", password: "" });
  const [adminErrors, setAdminErrors] = useState<QuickCreateErrors>({});
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const [clientForm, setClientForm] = useState<QuickCreateState>({ username: "", email: "", password: "" });
  const [clientErrors, setClientErrors] = useState<QuickCreateErrors>({});
  const [clientSubmitting, setClientSubmitting] = useState(false);

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedId) ?? null, [users, selectedId]);

  async function refreshList() {
    const list = await apiFetch<User[]>("/users", { cacheTtlMs: 0 });
    setUsers(list);
  }

  async function onRefreshClick() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await refreshList();
      setSuccess("Liste rafraîchie");
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refreshList();
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const d = await apiFetch<UserDetail>(`/users/${selectedId}`, { cacheTtlMs: 0 });
        if (!cancelled) setDetail(d);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
        setDetailError(msg);
        setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
    setSuccess(null);
    setError(null);

    const errs = validateForm(form, mode);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await apiFetch<User>("/users", {
          method: "POST",
          body: {
            username: form.username.trim(),
            email: form.email.trim(),
            role: form.role,
            password: form.password,
          },
        });
        setSuccess("Utilisateur créé avec succès");
      } else {
        if (!selectedUser) throw new Error("Aucun utilisateur sélectionné pour la modification");
        await apiFetch<User>(`/users/${selectedUser.id}`, {
          method: "PUT",
          body: {
            username: form.username.trim(),
            email: form.email.trim(),
            role: form.role,
          },
        });
        setSuccess("Utilisateur modifié avec succès");
      }

      await refreshList();
      resetFormToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) {
        setSuccess("Hors‑ligne: requête mise en attente (outbox)");
        resetFormToCreate();
        return;
      }
      const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDelete(u: User) {
    setSuccess(null);
    setError(null);
    const ok = confirm(`Supprimer l'utilisateur “${u.username}” ?`);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/users/${u.id}`, { method: "DELETE" });
      setSuccess("Utilisateur supprimé");

      if (selectedId === u.id) setSelectedId(null);
      await refreshList();
      resetFormToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) {
        setSuccess("Hors‑ligne: suppression mise en attente (outbox)");
        if (selectedId === u.id) setSelectedId(null);
        resetFormToCreate();
        return;
      }
      const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function createWithRole(role: "Admin" | "Viewer", form: QuickCreateState) {
    await apiFetch<User>("/users", {
      method: "POST",
      body: {
        username: form.username.trim(),
        email: form.email.trim(),
        role,
        password: form.password,
      },
    });
  }

  async function onCreateAdmin() {
    setSuccess(null);
    setError(null);

    const errs = validateQuickCreate(adminForm);
    setAdminErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAdminSubmitting(true);
    try {
      await createWithRole("Admin", adminForm);
      setSuccess("Compte Admin créé avec succès");
      setAdminForm({ username: "", email: "", password: "" });
      setAdminErrors({});
      await refreshList();
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
      setError(msg);
    } finally {
      setAdminSubmitting(false);
    }
  }

  async function onCreateClient() {
    setSuccess(null);
    setError(null);

    const errs = validateQuickCreate(clientForm);
    setClientErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setClientSubmitting(true);
    try {
      await createWithRole("Viewer", clientForm);
      setSuccess("Compte Client créé avec succès");
      setClientForm({ username: "", email: "", password: "" });
      setClientErrors({});
      await refreshList();
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
      setError(msg);
    } finally {
      setClientSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-semibold mb-6">Utilisateurs</h1>

      {loading ? <p>Chargement…</p> : null}
      {error ? <p className="text-red-600 mb-4">{error}</p> : null}
      {success ? <p className="text-green-700 mb-4">{success}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 border-[#d4c5f9] lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold">Liste</h2>
            <Button variant="outline" onClick={() => onRefreshClick().catch(() => undefined)} disabled={loading}>
              Rafraîchir
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="opacity-70">
                    Aucun utilisateur.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow
                    key={u.id}
                    className={selectedId === u.id ? "bg-muted/50" : undefined}
                    onClick={() => setSelectedId(u.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{u.id}</TableCell>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(u.id);
                            startEdit(u);
                          }}
                          disabled={isSubmitting}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(u).catch(() => undefined);
                          }}
                          disabled={isSubmitting}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4">
            <h3 className="text-base font-semibold mb-2">Détail</h3>
            {!selectedId ? (
              <p className="opacity-70">Sélectionne un utilisateur dans la liste.</p>
            ) : detailLoading ? (
              <p>Chargement du détail…</p>
            ) : detailError ? (
              <p className="text-red-600">{detailError}</p>
            ) : detail ? (
              <div className="space-y-1">
                <div>
                  <span className="opacity-70">Username:</span> {detail.username}
                </div>
                <div>
                  <span className="opacity-70">Email:</span> {detail.email}
                </div>
                <div>
                  <span className="opacity-70">Rôle:</span> {detail.role}
                </div>
                <div>
                  <span className="opacity-70">Actif:</span> {detail.isActive ? "Oui" : "Non"}
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-4 border-[#d4c5f9] h-fit">
          <h2 className="text-lg font-semibold mb-3">{mode === "create" ? "Créer" : "Modifier"}</h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm">Username</label>
              <Input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                aria-invalid={Boolean(formErrors.username) || undefined}
                placeholder="Ex: admin"
              />
              {formErrors.username ? <div className="text-sm text-red-600 mt-1">{formErrors.username}</div> : null}
            </div>

            <div>
              <label className="text-sm">Email</label>
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                aria-invalid={Boolean(formErrors.email) || undefined}
                placeholder="admin@nomina.app"
              />
              {formErrors.email ? <div className="text-sm text-red-600 mt-1">{formErrors.email}</div> : null}
            </div>

            <div>
              <label className="text-sm">Rôle</label>
              <Select value={form.role} onValueChange={(value) => setForm((f) => ({ ...f, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.role ? <div className="text-sm text-red-600 mt-1">{formErrors.role}</div> : null}
            </div>

            {mode === "create" ? (
              <div>
                <label className="text-sm">Mot de passe</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  aria-invalid={Boolean(formErrors.password) || undefined}
                  placeholder="Minimum 6 caractères"
                />
                {formErrors.password ? <div className="text-sm text-red-600 mt-1">{formErrors.password}</div> : null}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Button onClick={() => onSubmit().catch(() => undefined)} disabled={isSubmitting}>
                {isSubmitting ? "En cours…" : mode === "create" ? "Créer" : "Enregistrer"}
              </Button>
              <Button variant="outline" onClick={resetFormToCreate} disabled={isSubmitting}>
                Annuler
              </Button>
            </div>

            <div className="text-xs opacity-70">Validation côté client + gestion loading/erreurs/succès.</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-4 border-[#d4c5f9]">
          <h2 className="text-lg font-semibold mb-3">Formulaire Admin</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm">Username</label>
              <Input
                value={adminForm.username}
                onChange={(e) => setAdminForm((s) => ({ ...s, username: e.target.value }))}
                aria-invalid={Boolean(adminErrors.username) || undefined}
                placeholder="admin_nomina"
              />
              {adminErrors.username ? <div className="text-sm text-red-600 mt-1">{adminErrors.username}</div> : null}
            </div>

            <div>
              <label className="text-sm">Email</label>
              <Input
                value={adminForm.email}
                onChange={(e) => setAdminForm((s) => ({ ...s, email: e.target.value }))}
                aria-invalid={Boolean(adminErrors.email) || undefined}
                placeholder="admin@nomina.app"
              />
              {adminErrors.email ? <div className="text-sm text-red-600 mt-1">{adminErrors.email}</div> : null}
            </div>

            <div>
              <label className="text-sm">Mot de passe</label>
              <Input
                type="password"
                value={adminForm.password}
                onChange={(e) => setAdminForm((s) => ({ ...s, password: e.target.value }))}
                aria-invalid={Boolean(adminErrors.password) || undefined}
                placeholder="Minimum 6 caractères"
              />
              {adminErrors.password ? <div className="text-sm text-red-600 mt-1">{adminErrors.password}</div> : null}
            </div>

            <Button onClick={() => onCreateAdmin().catch(() => undefined)} disabled={adminSubmitting || isSubmitting}>
              {adminSubmitting ? "Création…" : "Créer Admin"}
            </Button>
          </div>
        </Card>

        <Card className="p-4 border-[#d4c5f9]">
          <h2 className="text-lg font-semibold mb-3">Formulaire Client</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm">Username</label>
              <Input
                value={clientForm.username}
                onChange={(e) => setClientForm((s) => ({ ...s, username: e.target.value }))}
                aria-invalid={Boolean(clientErrors.username) || undefined}
                placeholder="client_nomina"
              />
              {clientErrors.username ? <div className="text-sm text-red-600 mt-1">{clientErrors.username}</div> : null}
            </div>

            <div>
              <label className="text-sm">Email</label>
              <Input
                value={clientForm.email}
                onChange={(e) => setClientForm((s) => ({ ...s, email: e.target.value }))}
                aria-invalid={Boolean(clientErrors.email) || undefined}
                placeholder="client@nomina.app"
              />
              {clientErrors.email ? <div className="text-sm text-red-600 mt-1">{clientErrors.email}</div> : null}
            </div>

            <div>
              <label className="text-sm">Mot de passe</label>
              <Input
                type="password"
                value={clientForm.password}
                onChange={(e) => setClientForm((s) => ({ ...s, password: e.target.value }))}
                aria-invalid={Boolean(clientErrors.password) || undefined}
                placeholder="Minimum 6 caractères"
              />
              {clientErrors.password ? <div className="text-sm text-red-600 mt-1">{clientErrors.password}</div> : null}
            </div>

            <Button onClick={() => onCreateClient().catch(() => undefined)} disabled={clientSubmitting || isSubmitting}>
              {clientSubmitting ? "Création…" : "Créer Client"}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}