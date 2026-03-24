import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError, getApiBaseUrl } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ModelTypeNav } from "../components/ModelTypeNav";
import { getErrorMessage } from "../lib/error-utils";

type Culture = { id: number; name: string };
type Category = { id: number; name: string };
type PrenomRef = { id: number; valeur?: string | null };
type NomFamilleRef = { id: number; valeur?: string | null };
type PersonnageRef = {
  id: number;
  prenom?: PrenomRef | null;
  nomFamille?: NomFamilleRef | null;
};

type Creature = {
  id: number;
  valeur: string;
  type?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  personnageId?: number | null;
  cultureId?: number | null;
  categorieId?: number | null;
  personnage?: PersonnageRef | null;
  culture?: Culture | null;
  categorie?: Category | null;
};

type FormState = {
  valeur: string;
  type: string;
  description: string;
  personnageId: string;
  cultureId: string;
  categorieId: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.valeur.trim()) errs.valeur = "La valeur est obligatoire";
  if (form.valeur.trim().length > 120) errs.valeur = "Trop long (max 120)";
  if (form.type.trim().length > 80) errs.type = "Trop long (max 80)";
  if (form.description.trim().length > 2000) errs.description = "Trop long (max 2000)";
  return errs;
}

function formatPersonnageLabel(p: PersonnageRef | null | undefined): string {
  if (!p) return "—";
  const prenom = p.prenom?.valeur?.trim() ?? "";
  const nom = p.nomFamille?.valeur?.trim() ?? "";
  const label = `${prenom} ${nom}`.trim();
  return label || `Personnage #${p.id}`;
}

export function CreaturesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<Creature[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [personnages, setPersonnages] = useState<PersonnageRef[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => items.find((c) => c.id === selectedId) ?? null, [items, selectedId]);

  const [search, setSearch] = useState("");
  const [filterCultureId, setFilterCultureId] = useState("");
  const [filterCategorieId, setFilterCategorieId] = useState("");
  const [filterPersonnageId, setFilterPersonnageId] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    valeur: "",
    type: "",
    description: "",
    personnageId: "",
    cultureId: "",
    categorieId: "",
  });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  async function refreshAll() {
    const [list, cs, cats, pers] = await Promise.all([
      apiFetch<Creature[]>("/creatures", { cacheTtlMs: 0 }),
      apiFetch<Culture[]>("/cultures", { cacheTtlMs: 0 }).catch(() => [] as Culture[]),
      apiFetch<Category[]>("/categories", { cacheTtlMs: 0 }).catch(() => [] as Category[]),
      apiFetch<PersonnageRef[]>("/personnages", { cacheTtlMs: 0 }).catch(() => [] as PersonnageRef[]),
    ]);

    setItems(list);
    setCultures(cs);
    setCategories(cats);
    setPersonnages(pers);
  }

  async function onRefreshClick() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await refreshAll();
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

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (filterCultureId && String(c.cultureId ?? "") !== filterCultureId) return false;
      if (filterCategorieId && String(c.categorieId ?? "") !== filterCategorieId) return false;
      if (filterPersonnageId && String(c.personnageId ?? "") !== filterPersonnageId) return false;

      if (!q) return true;
      const personnageLabel = formatPersonnageLabel(c.personnage).toLowerCase();
      const haystack = `${c.valeur ?? ""} ${c.type ?? ""} ${c.description ?? ""} ${personnageLabel}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search, filterCultureId, filterCategorieId, filterPersonnageId]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, filterCultureId, filterCategorieId, filterPersonnageId, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  function resetToCreate() {
    setMode("create");
    setSelectedId(null);
    setForm({
      valeur: "",
      type: "",
      description: "",
      personnageId: "",
      cultureId: "",
      categorieId: "",
    });
    setFormErrors({});
  }

  function startEdit(c: Creature) {
    setMode("edit");
    setSelectedId(c.id);
    setForm({
      valeur: c.valeur ?? "",
      type: c.type ?? "",
      description: c.description ?? "",
      personnageId: c.personnageId ? String(c.personnageId) : "",
      cultureId: c.cultureId ? String(c.cultureId) : "",
      categorieId: c.categorieId ? String(c.categorieId) : "",
    });
    setFormErrors({});
  }

  function toAbsoluteImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${getApiBaseUrl()}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  function triggerImageUpload(creatureId: number) {
    setUploadTargetId(creatureId);
    fileInputRef.current?.click();
  }

  async function onImageSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !uploadTargetId) return;

    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde (max 5 Mo).");
      return;
    }

    setError(null);
    setSuccess(null);
    setUploadingImage(true);

    try {
      const fd = new FormData();
      fd.append("image", file);

      await apiFetch<{ message: string; imageUrl: string }>(`/creatures/${uploadTargetId}/image`, {
        method: "POST",
        body: fd,
      });

      setSuccess("Image téléversée avec succès.");
      await refreshAll();
    } catch (error) {
      setError(getErrorMessage(error, "Échec du téléversement de l'image."));
    } finally {
      setUploadingImage(false);
      setUploadTargetId(null);
    }
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
        description: form.description.trim() ? form.description.trim() : null,
        personnageId: form.personnageId ? Number(form.personnageId) : null,
        cultureId: form.cultureId ? Number(form.cultureId) : null,
        categorieId: form.categorieId ? Number(form.categorieId) : null,
      };

      if (mode === "create") {
        await apiFetch<Creature>("/creatures", { method: "POST", body });
        setSuccess("Créature créée");
      } else {
        if (!selected) throw new Error("Aucune créature sélectionnée");
        await apiFetch<Creature>(`/creatures/${selected.id}`, { method: "PUT", body });
        setSuccess("Créature modifiée");
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

  async function onDelete(c: Creature) {
    setSuccess(null);
    setError(null);
    const ok = confirm(`Supprimer la créature “${c.valeur}” ?`);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/creatures/${c.id}`, { method: "DELETE" });
      setSuccess("Créature supprimée");
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
      <h1 className="text-3xl font-semibold mb-6">Créatures</h1>
      <ModelTypeNav />

      {loading ? <p>Chargement…</p> : null}
      {error ? <p className="text-red-600 mb-4">{error}</p> : null}
      {success ? <p className="text-green-700 mb-4">{success}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onImageSelected(e).catch(() => undefined)}
        />

        <Card className="p-4 border-[#d4c5f9] lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold">Liste</h2>
            <Button variant="outline" onClick={() => onRefreshClick().catch(() => undefined)} disabled={loading}>
              Rafraîchir
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 mb-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (nom, type, bio, personnage)"
              className="xl:col-span-2"
            />
            <select
              value={filterCultureId}
              onChange={(e) => setFilterCultureId(e.target.value)}
              className="h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
            >
              <option value="">Toutes cultures</option>
              {cultures.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filterCategorieId}
              onChange={(e) => setFilterCategorieId(e.target.value)}
              className="h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={filterPersonnageId}
              onChange={(e) => setFilterPersonnageId(e.target.value)}
              className="h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
            >
              <option value="">Tous personnages</option>
              {personnages.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {formatPersonnageLabel(p)}
                </option>
              ))}
            </select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Personnage lié</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="opacity-70">
                    Aucune créature pour ces filtres.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((c) => (
                  <TableRow
                    key={c.id}
                    className={selectedId === c.id ? "bg-muted/50" : undefined}
                    onClick={() => setSelectedId(c.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{c.id}</TableCell>
                    <TableCell className="font-medium">{c.valeur}</TableCell>
                    <TableCell>{c.type ?? "—"}</TableCell>
                    <TableCell>
                      {c.imageUrl ? (
                        <img
                          src={toAbsoluteImageUrl(c.imageUrl) ?? undefined}
                          alt={`Illustration de ${c.valeur}`}
                          className="w-12 h-12 rounded-md border border-[#d4c5f9] object-cover"
                        />
                      ) : (
                        <span className="opacity-60">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatPersonnageLabel(c.personnage)}</TableCell>
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
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerImageUpload(c.id);
                          }}
                          disabled={isSubmitting || uploadingImage}
                        >
                          {uploadingImage && uploadTargetId === c.id ? "Upload…" : "Image"}
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="opacity-80">
              {filteredItems.length} résultat(s) • page {page}/{totalPages}
            </div>
            <div className="flex items-center gap-2">
              <label className="opacity-80">Par page</label>
              <select
                value={String(pageSize)}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 rounded-md border border-[#d4c5f9] bg-white px-2"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
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
                placeholder="Ex: Dragon d’obsidienne"
              />
              {formErrors.valeur ? <div className="text-sm text-red-600 mt-1">{formErrors.valeur}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Type</label>
              <Input value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} />
              {formErrors.type ? <div className="text-sm text-red-600 mt-1">{formErrors.type}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Description / Bio</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                rows={4}
              />
              {formErrors.description ? <div className="text-sm text-red-600 mt-1">{formErrors.description}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Personnage lié</label>
              <select
                value={form.personnageId}
                onChange={(e) => setForm((s) => ({ ...s, personnageId: e.target.value }))}
                className="mt-2 w-full h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
              >
                <option value="">(Aucun)</option>
                {personnages.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {formatPersonnageLabel(p)}
                  </option>
                ))}
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
