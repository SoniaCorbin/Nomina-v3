import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, ApiError, getApiBaseUrl } from "../lib/api";
import { ModelTypeNav } from "../components/ModelTypeNav";
import { getErrorMessage } from "../lib/error-utils";

type Univers = { id: number; name: string; description?: string | null; imageUrl?: string | null };
type FormState = { name: string; description: string };
type FieldErrors = Partial<Record<keyof FormState, string>>;

function validateForm(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!f.name.trim()) e.name = "Le nom est obligatoire";
  if (f.name.trim().length > 80) e.name = "Max 80 caractères";
  if (f.description.trim().length > 500) e.description = "Max 500 caractères";
  return e;
}

export function UniversPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [items, setItems] = useState<Univers[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => items.find(i => i.id === selectedId) ?? null, [items, selectedId]);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  async function refreshList() { setItems(await apiFetch<Univers[]>("/univers", { cacheTtlMs: 0 })); }

  useEffect(() => { let c = false; (async () => { setLoading(true); setError(null); try { await refreshList(); } catch (e) { if (!c) setError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e)); } finally { if (!c) setLoading(false); } })(); return () => { c = true; }; }, []);

  function resetForm() { setMode("create"); setSelectedId(null); setForm({ name: "", description: "" }); setFormErrors({}); setSuccess(null); setError(null); }
  function startEdit(i: Univers) { setMode("edit"); setSelectedId(i.id); setForm({ name: i.name ?? "", description: i.description ?? "" }); setFormErrors({}); setSuccess(null); setError(null); }
  function toAbsUrl(u?: string | null) { if (!u) return null; if (u.startsWith("http")) return u; return `${getApiBaseUrl()}${u.startsWith("/") ? u : `/${u}`}`; }
  function triggerUpload(id: number) { setUploadTargetId(id); fileInputRef.current?.click(); }

  async function onImageSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !uploadTargetId) return;
    if (!file.type.startsWith("image/")) { setError("Le fichier doit être une image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Max 5 Mo."); return; }
    setError(null); setSuccess(null); setUploadingImage(true);
    try { const fd = new FormData(); fd.append("image", file); await apiFetch(`/univers/${uploadTargetId}/image`, { method: "POST", body: fd }); setSuccess("Image téléversée."); await refreshList(); }
    catch (err) { setError(getErrorMessage(err, "Échec du téléversement.")); }
    finally { setUploadingImage(false); setUploadTargetId(null); }
  }

  async function onSubmit() {
    setSuccess(null); setError(null);
    const errs = validateForm(form); setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setIsSubmitting(true);
    try {
      const body = { name: form.name.trim(), description: form.description.trim() || undefined };
      if (mode === "create") { await apiFetch("/univers", { method: "POST", body }); setSuccess("Univers créé."); }
      else { if (!selected) throw new Error("Aucun univers sélectionné"); await apiFetch(`/univers/${selected.id}`, { method: "PUT", body }); setSuccess("Univers modifié."); }
      await refreshList(); resetForm();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) { setSuccess("Hors-ligne : mis en attente."); resetForm(); return; }
      setError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e));
    } finally { setIsSubmitting(false); }
  }

  async function onDelete(i: Univers) {
    setSuccess(null); setError(null);
    if (!confirm(`Supprimer « ${i.name} » ?`)) return;
    setIsSubmitting(true);
    try { await apiFetch(`/univers/${i.id}`, { method: "DELETE" }); setSuccess("Supprimé."); if (selectedId === i.id) setSelectedId(null); await refreshList(); resetForm(); }
    catch (e) {
      if (e instanceof ApiError && e.status === 0 && e.payload?.queued) { setSuccess("Hors-ligne : suppression en attente."); resetForm(); return; }
      setError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e));
    } finally { setIsSubmitting(false); }
  }

  const inputCls = "w-full border border-rule rounded-lg bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30";
  const labelCls = "font-mono text-[9.5px] tracking-wide uppercase text-ink-3 block mb-1.5";

  return (
    <main className="min-h-screen p-6 bg-paper">
      <h1 className="font-heading text-3xl text-ink mb-1">Univers thématiques</h1>
      <ModelTypeNav />
      {loading && <p className="text-ink-3 text-sm">Chargement…</p>}
      {error && <p className="text-crit text-sm mb-3">{error}</p>}
      {success && <p className="text-sage text-sm mb-3">{success}</p>}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => onImageSelected(e).catch(() => undefined)} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-5 items-start">
        <div className="bg-velin border border-rule rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-rule">
            <h2 className="font-heading text-lg text-ink">Liste</h2>
            <button onClick={() => refreshList().catch(() => undefined)} disabled={loading} className="text-sm text-ink-blue hover:underline disabled:opacity-50">Rafraîchir</button>
          </div>
          <div className="grid grid-cols-[48px_1.3fr_2fr_130px] px-4 py-2.5 border-b border-rule font-mono text-[9.5px] tracking-wide uppercase text-ink-3">
            <span>ID</span><span>Nom</span><span>Description</span><span></span>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center text-ink-3 text-sm">Aucun univers.</div>
          ) : items.map(i => (
            <div key={i.id} onClick={() => setSelectedId(i.id)} className={`grid grid-cols-[48px_1.3fr_2fr_130px] px-4 py-3.5 border-b border-rule/60 items-center cursor-pointer transition-colors ${selectedId === i.id ? "bg-wax-soft" : "hover:bg-paper"}`}>
              <span className="font-mono text-xs text-ink-3">{String(i.id).padStart(2, "0")}</span>
              <span className="font-heading text-[15px] text-ink">{i.name}</span>
              <span className="text-[12.5px] text-ink-2 truncate" title={i.description ?? ""}>{i.description ?? ""}</span>
              <div className="flex gap-1.5">
                <button onClick={e => { e.stopPropagation(); startEdit(i); }} disabled={isSubmitting} className="text-[11px] text-ink-blue border border-ink-blue/30 rounded px-2 py-1 hover:bg-ink-blue/10 disabled:opacity-50">Modifier</button>
                <button onClick={e => { e.stopPropagation(); onDelete(i).catch(() => undefined); }} disabled={isSubmitting} className="text-[11px] text-wax border border-wax/35 rounded px-2 py-1 hover:bg-wax-soft disabled:opacity-50">Suppr.</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-velin border border-rule rounded-2xl p-5">
          <div className="font-heading text-lg text-ink mb-4">{mode === "create" ? "Nouvel univers" : "Modifier"}</div>
          <div className="space-y-3.5">
            <div><label className={labelCls}>Nom</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex : Fantasy médiévale" className={inputCls} />{formErrors.name && <p className="text-[11px] text-crit mt-1">{formErrors.name}</p>}</div>
            <div><label className={labelCls}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Courte description…" className={`${inputCls} resize-none`} />{formErrors.description ? <p className="text-[11px] text-crit mt-1">{formErrors.description}</p> : <p className="text-right font-mono text-[10px] text-ink-3 mt-1">{form.description.length} / 500</p>}</div>
            <div className="flex gap-2.5">
              <button onClick={() => onSubmit().catch(() => undefined)} disabled={isSubmitting} className="flex-1 bg-wax hover:bg-wax-hover text-velin rounded-lg py-2.5 text-[13.5px] font-semibold transition-colors disabled:opacity-50">{isSubmitting ? "En cours…" : mode === "create" ? "Créer" : "Enregistrer"}</button>
              <button onClick={resetForm} disabled={isSubmitting} className="border border-rule-2 text-ink rounded-lg px-4 py-2.5 text-[13.5px] hover:bg-paper-2 transition-colors disabled:opacity-50">Annuler</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}