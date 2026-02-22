import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError, getApiBaseUrl } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ModelTypeNav } from "../components/ModelTypeNav";

type Univers = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};

type FormState = {
  name: string;
  description: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.name.trim()) errs.name = "Le nom est obligatoire";
  if (form.name.trim().length > 80) errs.name = "Le nom est trop long (max 80)";
  if (form.description.trim().length > 500) errs.description = "La description est trop longue (max 500)";
  return errs;
}

export function UniversPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<Univers[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => items.find((u) => u.id === selectedId) ?? null, [items, selectedId]);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<FormState>({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  async function refreshList() {
    const list = await apiFetch<Univers[]>("/univers/all", { cacheTtlMs: 0 });
    setItems(list);
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

  function resetToCreate() {
    setMode("create");
    setSelectedId(null);
    setForm({ name: "", description: "" });
    setFormErrors({});
  }

  function startEdit(u: Univers) {
    setMode("edit");
    setSelectedId(u.id);
    setForm({ name: u.name ?? "", description: u.description ?? "" });
    setFormErrors({});
  }

  function toAbsoluteImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${getApiBaseUrl()}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  function triggerImageUpload(universId: number) {
    setUploadTargetId(universId);
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

      await apiFetch<{ message: string; imageUrl: string }>(`/univers/${uploadTargetId}/image`, {
        method: "POST",
        body: fd,
      });

      setSuccess("Image téléversée avec succès.");
      await refreshList();
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
        name: form.name.trim(),
        description: form.description.trim() ? form.description.trim() : null,
      };

      if (mode === "create") {
        await apiFetch<Univers>("/univers", { method: "POST", body });
        setSuccess("Univers créé");
      } else {
        if (!selected) throw new Error("Aucun univers sélectionné");
        await apiFetch<Univers>(`/univers/${selected.id}`, { method: "PUT", body });
        setSuccess("Univers modifié");
      }

      await refreshList();
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

  async function onDelete(u: Univers) {
    setSuccess(null);
    setError(null);

    const ok = confirm(`Supprimer l’univers “${u.name}” ?`);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/univers/${u.id}`, { method: "DELETE" });
      setSuccess("Univers supprimé");
      if (selectedId === u.id) setSelectedId(null);
      await refreshList();
      resetToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) {
        setSuccess("Hors‑ligne: suppression mise en attente (outbox)");
        if (selectedId === u.id) setSelectedId(null);
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
      <h1 className="text-3xl font-semibold mb-6">Univers thématiques</h1>
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
            <Button variant="outline" onClick={() => refreshList().catch(() => undefined)} disabled={loading}>
              Rafraîchir
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="opacity-70">
                    Aucun univers.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((u) => (
                  <TableRow
                    key={u.id}
                    className={selectedId === u.id ? "bg-muted/50" : undefined}
                    onClick={() => setSelectedId(u.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>{u.id}</TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>
                      {u.imageUrl ? (
                        <img
                          src={toAbsoluteImageUrl(u.imageUrl) ?? undefined}
                          alt={`Illustration de ${u.name}`}
                          className="w-12 h-12 rounded-md border border-[#d4c5f9] object-cover"
                        />
                      ) : (
                        <span className="opacity-60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[520px] truncate" title={u.description ?? ""}>
                      {u.description ?? ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(u);
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
                            triggerImageUpload(u.id);
                          }}
                          disabled={isSubmitting || uploadingImage}
                        >
                          {uploadingImage && uploadTargetId === u.id ? "Upload…" : "Image"}
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
              <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
              {formErrors.name ? <div className="text-sm text-red-600 mt-1">{formErrors.name}</div> : null}
            </div>

            <div>
              <label className="text-sm opacity-80">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                rows={4}
              />
              {formErrors.description ? (
                <div className="text-sm text-red-600 mt-1">{formErrors.description}</div>
              ) : null}
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
