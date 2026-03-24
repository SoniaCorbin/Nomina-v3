import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError, getApiBaseUrl } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ModelTypeNav } from "../components/ModelTypeNav";
import { getErrorMessage } from "../lib/error-utils";

type Univers = { id: number; name: string };

type Category = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  universId: number;
  univers?: Univers;
};

type FormState = {
  name: string;
  description: string;
  universId: string; // "" => Tous
  universName: string; // utilisé si universId vide
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.name.trim()) errs.name = "Le nom est obligatoire";
  if (form.name.trim().length > 80) errs.name = "Le nom est trop long (max 80)";
  if (form.description.trim().length > 500) errs.description = "La description est trop longue (max 500)";
  if (!form.universId && form.universName.trim().length > 80) errs.universName = "Le nom de l’univers est trop long (max 80)";
  return errs;
}

export function CategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<Category[]>([]);
  const [univers, setUnivers] = useState<Univers[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => items.find((c) => c.id === selectedId) ?? null, [items, selectedId]);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState>({ name: "", description: "", universId: "", universName: "Tous" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  async function refreshAll() {
    const [list, uni] = await Promise.all([
      apiFetch<Category[]>("/categories", { cacheTtlMs: 0 }),
      apiFetch<Univers[]>("/univers", { cacheTtlMs: 0 }).catch(() => [] as Univers[]),
    ]);
    setItems(list);
    setUnivers(uni);
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
    setForm({ name: "", description: "", universId: "", universName: "Tous" });
    setFormErrors({});
  }

  function startEdit(c: Category) {
    setMode("edit");
    setSelectedId(c.id);
    setForm({
      name: c.name ?? "",
      description: c.description ?? "",
      universId: c.universId ? String(c.universId) : "",
      universName: c.univers?.name ?? "Tous",
    });
    setFormErrors({});
  }

  function toAbsoluteImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${getApiBaseUrl()}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  function triggerImageUpload(categoryId: number) {
    setUploadTargetId(categoryId);
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

      await apiFetch<{ message: string; imageUrl: string }>(`/categories/${uploadTargetId}/image`, {
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
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() ? form.description.trim() : undefined,
      };

      if (form.universId) body.universId = Number(form.universId);
      else body.universName = form.universName.trim() ? form.universName.trim() : "Tous";

      if (mode === "create") {
        await apiFetch<Category>("/categories", { method: "POST", body });
        setSuccess("Catégorie créée");
      } else {
        if (!selected) throw new Error("Aucune catégorie sélectionnée");
        await apiFetch<Category>(`/categories/${selected.id}`, { method: "PUT", body });
        setSuccess("Catégorie modifiée");
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

  async function onDelete(c: Category) {
    setSuccess(null);
    setError(null);
    const ok = confirm(`Supprimer la catégorie “${c.name}” ?`);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/categories/${c.id}`, { method: "DELETE" });
      setSuccess("Catégorie supprimée");
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
      <h1 className="text-3xl font-semibold mb-6">Catégories</h1>
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
                <TableHead>Nom</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Univers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="opacity-70">
                    Aucune catégorie.
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
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      {c.imageUrl ? (
                        <img
                          src={toAbsoluteImageUrl(c.imageUrl) ?? undefined}
                          alt={`Illustration de ${c.name}`}
                          className="w-12 h-12 rounded-md border border-[#d4c5f9] object-cover"
                        />
                      ) : (
                        <span className="opacity-60">—</span>
                      )}
                    </TableCell>
                    <TableCell>{c.univers?.name ?? c.universId}</TableCell>
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
              <label className="text-sm opacity-80">Nom *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Ex: Fantasy"
              />
              {formErrors.name ? <div className="text-sm text-red-600 mt-1">{formErrors.name}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Optionnel"
                rows={4}
              />
              {formErrors.description ? (
                <div className="text-sm text-red-600 mt-1">{formErrors.description}</div>
              ) : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Univers</label>
              <select
                value={form.universId}
                onChange={(e) => setForm((s) => ({ ...s, universId: e.target.value }))}
                className="mt-2 w-full h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
              >
                <option value="">Tous (par défaut)</option>
                {univers.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {!form.universId ? (
              <div>
                <label className="text-sm opacity-80">Nom d’univers (si pas sélectionné)</label>
                <Input
                  value={form.universName}
                  onChange={(e) => setForm((s) => ({ ...s, universName: e.target.value }))}
                  placeholder="Tous"
                />
                {formErrors.universName ? (
                  <div className="text-sm text-red-600 mt-1">{formErrors.universName}</div>
                ) : null}
              </div>
            ) : null}

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
