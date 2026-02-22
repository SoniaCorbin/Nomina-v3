import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ModelTypeNav } from "../components/ModelTypeNav";

type Category = { id: number; name: string };

type Concept = {
  id: number;
  valeur: string;
  type?: string | null;
  mood?: string | null;
  keywords?: string | null;
  categorieId?: number | null;
  categorie?: Category | null;
};

type FormState = {
  valeur: string;
  type: string;
  mood: string;
  keywords: string;
  categorieId: string; // "" => null
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.valeur.trim()) errs.valeur = "La valeur est obligatoire";
  if (form.valeur.trim().length > 120) errs.valeur = "Trop long (max 120)";
  if (form.type.trim().length > 80) errs.type = "Trop long (max 80)";
  if (form.mood.trim().length > 80) errs.mood = "Trop long (max 80)";
  if (form.keywords.trim().length > 200) errs.keywords = "Trop long (max 200)";
  return errs;
}

export function ConceptsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<Concept[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => items.find((c) => c.id === selectedId) ?? null, [items, selectedId]);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({ valeur: "", type: "", mood: "", keywords: "", categorieId: "" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  async function refreshAll() {
    const [list, cats] = await Promise.all([
      apiFetch<Concept[]>("/concepts", { cacheTtlMs: 0 }),
      apiFetch<Category[]>("/categories", { cacheTtlMs: 0 }).catch(() => [] as Category[]),
    ]);
    setItems(list);
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
    setForm({ valeur: "", type: "", mood: "", keywords: "", categorieId: "" });
    setFormErrors({});
  }

  function startEdit(c: Concept) {
    setMode("edit");
    setSelectedId(c.id);
    setForm({
      valeur: c.valeur ?? "",
      type: c.type ?? "",
      mood: c.mood ?? "",
      keywords: c.keywords ?? "",
      categorieId: c.categorieId ? String(c.categorieId) : "",
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
        valeur: form.valeur.trim(),
        type: form.type.trim() ? form.type.trim() : null,
        mood: form.mood.trim() ? form.mood.trim() : null,
        keywords: form.keywords.trim() ? form.keywords.trim() : null,
        categorieId: form.categorieId ? Number(form.categorieId) : null,
      };

      if (mode === "create") {
        await apiFetch<Concept>("/concepts", { method: "POST", body });
        setSuccess("Concept créé");
      } else {
        if (!selected) throw new Error("Aucun concept sélectionné");
        await apiFetch<Concept>(`/concepts/${selected.id}`, { method: "PUT", body });
        setSuccess("Concept modifié");
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

  async function onDelete(c: Concept) {
    setSuccess(null);
    setError(null);
    const ok = confirm(`Supprimer le concept “${c.valeur}” ?`);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/concepts/${c.id}`, { method: "DELETE" });
      setSuccess("Concept supprimé");
      if (selectedId === c.id) setSelectedId(null);
      await refreshAll();
      resetToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) {
        setSuccess("Hors‑ligne: suppression mise en attente (outbox)");
        if (selectedId === c.id) setSelectedId(null);
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
      <h1 className="text-3xl font-semibold mb-6">Concepts</h1>
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
                <TableHead>Valeur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="opacity-70">
                    Aucun concept.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((c) => (
                  <TableRow
                    key={c.id}
                    className={selectedId === c.id ? "bg-muted/50" : undefined}
                    onClick={() => setSelectedId(c.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{c.id}</TableCell>
                    <TableCell className="font-medium">{c.valeur}</TableCell>
                    <TableCell>{c.categorie?.name ?? c.categorieId ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(c);
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
                            onDelete(c).catch(() => undefined);
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
              <label className="text-sm opacity-80">Valeur *</label>
              <Input
                value={form.valeur}
                onChange={(e) => setForm((s) => ({ ...s, valeur: e.target.value }))}
                placeholder="Ex: Oracles"
              />
              {formErrors.valeur ? <div className="text-sm text-red-600 mt-1">{formErrors.valeur}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Type</label>
              <Input value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} />
              {formErrors.type ? <div className="text-sm text-red-600 mt-1">{formErrors.type}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Mood</label>
              <Input value={form.mood} onChange={(e) => setForm((s) => ({ ...s, mood: e.target.value }))} />
              {formErrors.mood ? <div className="text-sm text-red-600 mt-1">{formErrors.mood}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Keywords</label>
              <Textarea
                value={form.keywords}
                onChange={(e) => setForm((s) => ({ ...s, keywords: e.target.value }))}
                rows={3}
              />
              {formErrors.keywords ? <div className="text-sm text-red-600 mt-1">{formErrors.keywords}</div> : null}
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

            <p className="text-xs opacity-70">
              Note: les écritures (create/update/delete) sont réservées à l’admin.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
