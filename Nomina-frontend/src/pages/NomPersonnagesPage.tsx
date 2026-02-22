import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ModelTypeNav } from "../components/ModelTypeNav";

type Culture = { id: number; name: string };
type Category = { id: number; name: string };

type NomPersonnage = {
  id: number;
  valeur?: string | null;
  genre?: string | null; // M/F/NB
  cultureId?: number | null;
  categorieId?: number | null;
  culture?: Culture | null;
  categorie?: Category | null;
};

type FormState = {
  valeur: string;
  genre: string; // "" => null
  cultureId: string;
  categorieId: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.valeur.trim()) errs.valeur = "La valeur est obligatoire";
  if (form.valeur.trim().length > 120) errs.valeur = "Trop long (max 120)";
  return errs;
}

export function NomPersonnagesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<NomPersonnage[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => items.find((n) => n.id === selectedId) ?? null, [items, selectedId]);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({ valeur: "", genre: "", cultureId: "", categorieId: "" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  async function refreshAll() {
    const [list, cs, cats] = await Promise.all([
      apiFetch<NomPersonnage[]>("/nomPersonnages", { cacheTtlMs: 0 }),
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
    setForm({ valeur: "", genre: "", cultureId: "", categorieId: "" });
    setFormErrors({});
  }

  function startEdit(n: NomPersonnage) {
    setMode("edit");
    setSelectedId(n.id);
    setForm({
      valeur: n.valeur ?? "",
      genre: n.genre ?? "",
      cultureId: n.cultureId ? String(n.cultureId) : "",
      categorieId: n.categorieId ? String(n.categorieId) : "",
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
        genre: form.genre ? form.genre : null,
        cultureId: form.cultureId ? Number(form.cultureId) : null,
        categorieId: form.categorieId ? Number(form.categorieId) : null,
      };

      if (mode === "create") {
        await apiFetch<NomPersonnage>("/nomPersonnages", { method: "POST", body });
        setSuccess("Nom de personnage créé");
      } else {
        if (!selected) throw new Error("Aucun nom sélectionné");
        await apiFetch<NomPersonnage>(`/nomPersonnages/${selected.id}`, { method: "PUT", body });
        setSuccess("Nom de personnage modifié");
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

  async function onDelete(n: NomPersonnage) {
    setSuccess(null);
    setError(null);
    const ok = confirm(`Supprimer “${n.valeur ?? `#${n.id}`}” ?`);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/nomPersonnages/${n.id}`, { method: "DELETE" });
      setSuccess("Nom supprimé");
      if (selectedId === n.id) setSelectedId(null);
      await refreshAll();
      resetToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) {
        setSuccess("Hors‑ligne: suppression mise en attente (outbox)");
        if (selectedId === n.id) setSelectedId(null);
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
      <h1 className="text-3xl font-semibold mb-6">Noms de personnages</h1>
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
                <TableHead>Genre</TableHead>
                <TableHead>Culture</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="opacity-70">
                    Aucun nom.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((n) => (
                  <TableRow
                    key={n.id}
                    className={selectedId === n.id ? "bg-muted/50" : undefined}
                    onClick={() => setSelectedId(n.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{n.id}</TableCell>
                    <TableCell className="font-medium">{n.valeur ?? ""}</TableCell>
                    <TableCell>{n.genre ?? "—"}</TableCell>
                    <TableCell>{n.culture?.name ?? n.cultureId ?? "—"}</TableCell>
                    <TableCell>{n.categorie?.name ?? n.categorieId ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(n);
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
                            onDelete(n).catch(() => undefined);
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
              <Input value={form.valeur} onChange={(e) => setForm((s) => ({ ...s, valeur: e.target.value }))} />
              {formErrors.valeur ? <div className="text-sm text-red-600 mt-1">{formErrors.valeur}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Genre</label>
              <select
                value={form.genre}
                onChange={(e) => setForm((s) => ({ ...s, genre: e.target.value }))}
                className="mt-2 w-full h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
              >
                <option value="">(Aucun)</option>
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="NB">NB</option>
              </select>
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
