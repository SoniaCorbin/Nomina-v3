import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError, getApiBaseUrl } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ModelTypeNav } from "../components/ModelTypeNav";

type Category = { id: number; name: string };

type Lieu = {
  id: number;
  value: string;
  type?: string | null;
  imageUrl?: string | null;
  categorieId?: number | null;
  categorie?: Category | null;
};

type FormState = {
  value: string;
  type: string;
  categorieId: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.value.trim()) errs.value = "La valeur est obligatoire";
  if (form.value.trim().length > 120) errs.value = "Trop long (max 120)";
  if (form.type.trim().length > 80) errs.type = "Trop long (max 80)";
  return errs;
}

export function LieuxPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<Lieu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => items.find((l) => l.id === selectedId) ?? null, [items, selectedId]);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState>({ value: "", type: "", categorieId: "" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  async function refreshAll() {
    const [list, cats] = await Promise.all([
      apiFetch<Lieu[]>("/lieux", { cacheTtlMs: 0 }),
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
    setForm({ value: "", type: "", categorieId: "" });
    setFormErrors({});
  }

  function startEdit(l: Lieu) {
    setMode("edit");
    setSelectedId(l.id);
    setForm({ value: l.value ?? "", type: l.type ?? "", categorieId: l.categorieId ? String(l.categorieId) : "" });
    setFormErrors({});
  }

  function toAbsoluteImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${getApiBaseUrl()}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  function triggerImageUpload(lieuId: number) {
    setUploadTargetId(lieuId);
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

      await apiFetch<{ message: string; imageUrl: string }>(`/lieux/${uploadTargetId}/image`, {
        method: "POST",
        body: fd,
      });

      setSuccess("Image téléversée avec succès.");
      await refreshAll();
    } catch (err) {
      setError(String((err as any)?.message ?? err));
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
        value: form.value.trim(),
        type: form.type.trim() ? form.type.trim() : null,
        categorieId: form.categorieId ? Number(form.categorieId) : null,
      };

      if (mode === "create") {
        await apiFetch<Lieu>("/lieux", { method: "POST", body });
        setSuccess("Lieu créé");
      } else {
        if (!selected) throw new Error("Aucun lieu sélectionné");
        await apiFetch<Lieu>(`/lieux/${selected.id}`, { method: "PUT", body });
        setSuccess("Lieu modifié");
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

  async function onDelete(l: Lieu) {
    setSuccess(null);
    setError(null);
    const ok = confirm(`Supprimer le lieu “${l.value}” ?`);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/lieux/${l.id}`, { method: "DELETE" });
      setSuccess("Lieu supprimé");
      if (selectedId === l.id) setSelectedId(null);
      await refreshAll();
      resetToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) {
        setSuccess("Hors‑ligne: suppression mise en attente (outbox)");
        if (selectedId === l.id) setSelectedId(null);
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
      <h1 className="text-3xl font-semibold mb-6">Lieux</h1>
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
            <Button variant="outline" onClick={() => refreshAll().catch(() => undefined)} disabled={loading}>
              Rafraîchir
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="opacity-70">
                    Aucun lieu.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((l) => (
                  <TableRow
                    key={l.id}
                    className={selectedId === l.id ? "bg-muted/50" : undefined}
                    onClick={() => setSelectedId(l.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{l.id}</TableCell>
                    <TableCell className="font-medium">{l.value}</TableCell>
                    <TableCell>{l.type ?? "—"}</TableCell>
                    <TableCell>
                      {l.imageUrl ? (
                        <img
                          src={toAbsoluteImageUrl(l.imageUrl) ?? undefined}
                          alt={`Illustration de ${l.value}`}
                          className="w-12 h-12 rounded-md border border-[#d4c5f9] object-cover"
                        />
                      ) : (
                        <span className="opacity-60">—</span>
                      )}
                    </TableCell>
                    <TableCell>{l.categorie?.name ?? l.categorieId ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(l);
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
                            triggerImageUpload(l.id);
                          }}
                          disabled={isSubmitting || uploadingImage}
                        >
                          {uploadingImage && uploadTargetId === l.id ? "Upload…" : "Image"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(l).catch(() => undefined);
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
              <Input value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))} />
              {formErrors.value ? <div className="text-sm text-red-600 mt-1">{formErrors.value}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Type</label>
              <Input value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))} />
              {formErrors.type ? <div className="text-sm text-red-600 mt-1">{formErrors.type}</div> : null}
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
