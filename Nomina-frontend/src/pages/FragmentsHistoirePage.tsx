import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ModelTypeNav } from "../components/ModelTypeNav";

type Culture = { id: number; name: string };
type Category = { id: number; name: string };

type Fragment = {
  id: number;
  texte: string;
  appliesTo?: string | null;
  genre?: string | null;
  minNameLength?: number | null;
  maxNameLength?: number | null;
  cultureId?: number | null;
  categorieId?: number | null;
  culture?: Culture | null;
  categorie?: Category | null;
};

type FormState = {
  texte: string;
  appliesTo: string;
  genre: string;
  minNameLength: string;
  maxNameLength: string;
  cultureId: string;
  categorieId: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.texte.trim()) errs.texte = "Le texte est obligatoire";
  if (form.texte.trim().length > 2000) errs.texte = "Trop long (max 2000)";

  const min = form.minNameLength.trim() ? Number(form.minNameLength) : null;
  const max = form.maxNameLength.trim() ? Number(form.maxNameLength) : null;
  if (min !== null && (!Number.isFinite(min) || min < 0)) errs.minNameLength = "Nombre invalide";
  if (max !== null && (!Number.isFinite(max) || max < 0)) errs.maxNameLength = "Nombre invalide";
  if (min !== null && max !== null && min > max) errs.maxNameLength = "Max doit être ≥ Min";

  return errs;
}

export function FragmentsHistoirePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<Fragment[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => items.find((f) => f.id === selectedId) ?? null, [items, selectedId]);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    texte: "",
    appliesTo: "",
    genre: "",
    minNameLength: "",
    maxNameLength: "",
    cultureId: "",
    categorieId: "",
  });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  async function refreshAll() {
    const [list, cs, cats] = await Promise.all([
      apiFetch<Fragment[]>("/fragmentsHistoire", { cacheTtlMs: 0 }),
      apiFetch<Culture[]>("/cultures", { cacheTtlMs: 0 }).catch(() => [] as Culture[]),
      apiFetch<Category[]>("/categories", { cacheTtlMs: 0 }).catch(() => [] as Category[]),
    ]);

    setItems(list);
    setCultures(cs);
    setCategories(cats);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refreshAll();
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

  function resetToCreate() {
    setMode("create");
    setSelectedId(null);
    setForm({
      texte: "",
      appliesTo: "",
      genre: "",
      minNameLength: "",
      maxNameLength: "",
      cultureId: "",
      categorieId: "",
    });
    setFormErrors({});
  }

  function startEdit(f: Fragment) {
    setMode("edit");
    setSelectedId(f.id);
    setForm({
      texte: f.texte ?? "",
      appliesTo: f.appliesTo ?? "",
      genre: f.genre ?? "",
      minNameLength: f.minNameLength === null || f.minNameLength === undefined ? "" : String(f.minNameLength),
      maxNameLength: f.maxNameLength === null || f.maxNameLength === undefined ? "" : String(f.maxNameLength),
      cultureId: f.cultureId ? String(f.cultureId) : "",
      categorieId: f.categorieId ? String(f.categorieId) : "",
    });
    setFormErrors({});
  }

  async function onSubmit() {
    setSuccess(null);
    setError(null);

    const errs = validateForm(form);
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    try {
      const body = {
        texte: form.texte.trim(),
        appliesTo: form.appliesTo.trim() ? form.appliesTo.trim() : null,
        genre: form.genre.trim() ? form.genre.trim() : null,
        minNameLength: form.minNameLength.trim() ? Number(form.minNameLength) : null,
        maxNameLength: form.maxNameLength.trim() ? Number(form.maxNameLength) : null,
        cultureId: form.cultureId ? Number(form.cultureId) : null,
        categorieId: form.categorieId ? Number(form.categorieId) : null,
      };

      if (mode === "create") {
        await apiFetch<Fragment>("/fragmentsHistoire", { method: "POST", body });
        setSuccess("Fragment créé");
      } else {
        if (!selected) throw new Error("Aucun fragment sélectionné");
        await apiFetch<Fragment>(`/fragmentsHistoire/${selected.id}`, { method: "PUT", body });
        setSuccess("Fragment modifié");
      }

      await refreshAll();
      resetToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) {
        setSuccess("Hors‑ligne: requête mise en attente (outbox)");
        resetToCreate();
        return;
      }
      const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDelete(f: Fragment) {
    setSuccess(null);
    setError(null);
    const ok = confirm(`Supprimer ce fragment (#${f.id}) ?`);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/fragmentsHistoire/${f.id}`, { method: "DELETE" });
      setSuccess("Fragment supprimé");
      if (selectedId === f.id) setSelectedId(null);
      await refreshAll();
      resetToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) {
        setSuccess("Hors‑ligne: suppression mise en attente (outbox)");
        if (selectedId === f.id) setSelectedId(null);
        resetToCreate();
        return;
      }
      const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-semibold mb-6">Fragments d’histoire</h1>
      <ModelTypeNav />

      {loading ? <p>Chargement…</p> : null}
      {error ? <p className="text-red-600 mb-4">{error}</p> : null}
      {success ? <p className="text-green-700 mb-4">{success}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 border-[#d4c5f9] lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold">Liste</h2>
            <Button variant="outline" onClick={() => refreshAll().catch(() => undefined)} disabled={loading}>
              Rafraîchir
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Texte</TableHead>
                <TableHead>Culture</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="opacity-70">
                    Aucun fragment.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((f) => (
                  <TableRow
                    key={f.id}
                    className={selectedId === f.id ? "bg-muted/50" : undefined}
                    onClick={() => setSelectedId(f.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{f.id}</TableCell>
                    <TableCell className="max-w-[520px] truncate" title={f.texte}>
                      {f.texte}
                    </TableCell>
                    <TableCell>{f.culture?.name ?? f.cultureId ?? "—"}</TableCell>
                    <TableCell>{f.categorie?.name ?? f.categorieId ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(f);
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
                            onDelete(f).catch(() => undefined);
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
        </Card>

        <Card className="p-4 border-[#d4c5f9]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{mode === "create" ? "Créer" : "Modifier"}</h2>
            {mode === "edit" ? (
              <Button variant="outline" onClick={resetToCreate} disabled={isSubmitting}>
                Annuler
              </Button>
            ) : null}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm opacity-80">Texte *</label>
              <Textarea
                value={form.texte}
                onChange={(e) => setForm((s) => ({ ...s, texte: e.target.value }))}
                rows={5}
              />
              {formErrors.texte ? <div className="text-sm text-red-600 mt-1">{formErrors.texte}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">AppliesTo</label>
              <Input value={form.appliesTo} onChange={(e) => setForm((s) => ({ ...s, appliesTo: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm opacity-80">Genre</label>
              <Input value={form.genre} onChange={(e) => setForm((s) => ({ ...s, genre: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm opacity-80">Min len</label>
                <Input
                  value={form.minNameLength}
                  onChange={(e) => setForm((s) => ({ ...s, minNameLength: e.target.value }))}
                  inputMode="numeric"
                />
                {formErrors.minNameLength ? (
                  <div className="text-sm text-red-600 mt-1">{formErrors.minNameLength}</div>
                ) : null}
              </div>
              <div>
                <label className="text-sm opacity-80">Max len</label>
                <Input
                  value={form.maxNameLength}
                  onChange={(e) => setForm((s) => ({ ...s, maxNameLength: e.target.value }))}
                  inputMode="numeric"
                />
                {formErrors.maxNameLength ? (
                  <div className="text-sm text-red-600 mt-1">{formErrors.maxNameLength}</div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="text-sm opacity-80">Culture</label>
              <select
                value={form.cultureId}
                onChange={(e) => setForm((s) => ({ ...s, cultureId: e.target.value }))}
                className="mt-2 w-full h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
              >
                <option value="">(Aucune)</option>
                {cultures.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm opacity-80">Catégorie</label>
              <select
                value={form.categorieId}
                onChange={(e) => setForm((s) => ({ ...s, categorieId: e.target.value }))}
                className="mt-2 w-full h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
              >
                <option value="">(Aucune)</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={() => onSubmit().catch(() => undefined)} disabled={isSubmitting}>
              {isSubmitting ? "Envoi…" : mode === "create" ? "Créer" : "Enregistrer"}
            </Button>

            <p className="text-xs opacity-70">Note: les écritures sont réservées à l’admin.</p>
          </div>
        </Card>
      </div>
    </main>
  );
}
