import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { apiFetch, ApiError, getApiBaseUrl } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ModelTypeNav } from "../components/ModelTypeNav";
import { getErrorMessage } from "../lib/error-utils";

type Culture = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};

type CultureDetail = Culture & {
  nomPersonnages?: unknown[];
  fragmentsHistoire?: unknown[];
  titres?: unknown[];
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

export function CulturesPage() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-3xl font-semibold mb-2">Cultures</h1>
        <p className="opacity-80">Accès restreint: auth désactivée (clé Clerk manquante).</p>
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <main className="min-h-screen p-6">
          <h1 className="text-3xl font-semibold mb-2">Cultures</h1>
          <p className="opacity-80">Connexion requise pour gérer les cultures.</p>
        </main>
      </SignedOut>
      <SignedIn>
        <CulturesInner />
      </SignedIn>
    </>
  );
}

function CulturesInner() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [cultures, setCultures] = useState<Culture[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CultureDetail | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const [form, setForm] = useState<FormState>({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  const selectedCulture = useMemo(() => cultures.find((c) => c.id === selectedId) ?? null, [cultures, selectedId]);

  async function refreshList() {
    const list = await apiFetch<Culture[]>("/cultures", { cacheTtlMs: 0 });
    setCultures(list);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const d = await apiFetch<CultureDetail>(`/cultures/${selectedId}`, { cacheTtlMs: 0 });
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
    setForm({ name: "", description: "" });
    setFormErrors({});
    setSuccess(null);
    setError(null);
  }

  function startEdit(c: Culture) {
    setMode("edit");
    setForm({ name: c.name ?? "", description: c.description ?? "" });
    setFormErrors({});
    setSuccess(null);
    setError(null);
  }

  function toAbsoluteImageUrl(imageUrl?: string | null): string | null {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
    return `${getApiBaseUrl()}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
  }

  function triggerImageUpload(cultureId: number) {
    setUploadTargetId(cultureId);
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

      await apiFetch<{ message: string; imageUrl: string }>(`/cultures/${uploadTargetId}/image`, {
        method: "POST",
        body: fd,
      });

      setSuccess("Image téléversée avec succès.");
      await refreshList();
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
      if (mode === "create") {
        await apiFetch<Culture>("/cultures", {
          method: "POST",
          body: { name: form.name.trim(), description: form.description.trim() },
        });
        setSuccess("Culture créée avec succès");
      } else {
        if (!selectedCulture) throw new Error("Aucune culture sélectionnée pour la modification");
        await apiFetch<Culture>(`/cultures/${selectedCulture.id}`, {
          method: "PUT",
          body: { name: form.name.trim(), description: form.description.trim() },
        });
        setSuccess("Culture modifiée avec succès");
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

  async function onDelete(c: Culture) {
    setSuccess(null);
    setError(null);
    const ok = confirm(`Supprimer la culture “${c.name}” ?`);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      await apiFetch<void>(`/cultures/${c.id}`, { method: "DELETE" });
      setSuccess("Culture supprimée");

      if (selectedId === c.id) setSelectedId(null);
      await refreshList();
      resetFormToCreate();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) {
        setSuccess("Hors‑ligne: suppression mise en attente (outbox)");
        if (selectedId === c.id) setSelectedId(null);
        resetFormToCreate();
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
      <h1 className="text-3xl font-semibold mb-6">Cultures</h1>
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
              {cultures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="opacity-70">
                    Aucune culture.
                  </TableCell>
                </TableRow>
              ) : (
                cultures.map((c) => (
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
                    <TableCell className="max-w-[420px] truncate" title={c.description ?? ""}>
                      {c.description ?? ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(c.id);
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

          <div className="mt-4">
            <h3 className="text-base font-semibold mb-2">Détail</h3>
            {!selectedId ? (
              <p className="opacity-70">Sélectionne une culture dans la liste.</p>
            ) : detailLoading ? (
              <p>Chargement du détail…</p>
            ) : detailError ? (
              <p className="text-red-600">{detailError}</p>
            ) : detail ? (
              <div className="space-y-1">
                <div>
                  <span className="opacity-70">Nom:</span> {detail.name}
                </div>
                <div>
                  <span className="opacity-70">Description:</span> {detail.description ?? ""}
                </div>
                <div className="opacity-70">
                  Liens: noms={detail.nomPersonnages?.length ?? 0} — fragments={detail.fragmentsHistoire?.length ?? 0} — titres=
                  {detail.titres?.length ?? 0}
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-4 border-[#d4c5f9] h-fit">
          <h2 className="text-lg font-semibold mb-3">{mode === "create" ? "Créer" : "Modifier"}</h2>

          <div className="space-y-3">
            <div>
              <label className="text-sm">Nom</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                aria-invalid={Boolean(formErrors.name) || undefined}
                placeholder="Ex: Nordiques"
              />
              {formErrors.name ? <div className="text-sm text-red-600 mt-1">{formErrors.name}</div> : null}
            </div>

            <div>
              <label className="text-sm">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                aria-invalid={Boolean(formErrors.description) || undefined}
                placeholder="Courte description…"
              />
              {formErrors.description ? (
                <div className="text-sm text-red-600 mt-1">{formErrors.description}</div>
              ) : (
                <div className="text-xs opacity-60 mt-1">Max 500 caractères</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => onSubmit().catch(() => undefined)} disabled={isSubmitting}>
                {isSubmitting ? "En cours…" : mode === "create" ? "Créer" : "Enregistrer"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetFormToCreate();
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            </div>

            <div className="text-xs opacity-70">
              Validation côté client + gestion loading/erreurs/succès.
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
