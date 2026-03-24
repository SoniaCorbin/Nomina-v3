import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { persistPackResult, type PersistPackSummary } from "../lib/packPersistence";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────────

type SectionKey =
  | "personnages"
  | "lieux"
  | "organizations"
  | "events"
  | "creatures"
  | "fragmentsHistoire"
  | "titres"
  | "concepts";

type PackResultRow = Record<string, unknown>;

interface PackResult {
  meta: { language: string; model: string };
  result: Record<SectionKey, PackResultRow[]>;
}

// ── Config des sections ────────────────────────────────────────────────────────

const SECTIONS: { key: SectionKey; label: string; max: number }[] = [
  { key: "personnages", label: "Personnages", max: 5 },
  { key: "lieux", label: "Lieux", max: 10 },
  { key: "organizations", label: "Organisations", max: 10 },
  { key: "events", label: "Événements", max: 10 },
  { key: "creatures", label: "Créatures", max: 10 },
  { key: "fragmentsHistoire", label: "Fragments d'histoire", max: 20 },
  { key: "titres", label: "Titres", max: 20 },
  { key: "concepts", label: "Concepts", max: 20 },
];

const INPUT_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "personnage", label: "Personnage", placeholder: "ex: guerrière elfique solitaire" },
  { key: "prenom", label: "Prénom", placeholder: "ex: Aeryn" },
  { key: "nomFamille", label: "Nom de famille", placeholder: "ex: Solcrest" },
  { key: "occupation", label: "Occupation", placeholder: "ex: archère, alchimiste" },
  { key: "categorie", label: "Catégorie", placeholder: "ex: fantasy, médiéval" },
  { key: "concept", label: "Concept", placeholder: "ex: trahison, rédemption" },
  { key: "creature", label: "Créature", placeholder: "ex: draconide, golem" },
  { key: "event", label: "Événement", placeholder: "ex: bataille, couronnement" },
  { key: "lieux", label: "Lieux", placeholder: "ex: forêt maudite, cité flottante" },
  { key: "organization", label: "Organisation", placeholder: "ex: guilde des ombres" },
  { key: "classeSociale", label: "Classe sociale", placeholder: "ex: noble, roturier" },
  { key: "titre", label: "Titre", placeholder: "ex: Grand Maître, Archimage" },
  { key: "universThematique", label: "Univers thématique", placeholder: "ex: steampunk, lovecraftien" },
];

// ── Composant principal ────────────────────────────────────────────────────────

export function PackIAPage() {
  const [enabled, setEnabled] = useState<Record<SectionKey, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s.key, true])) as Record<SectionKey, boolean>
  );
  const [counts, setCounts] = useState<Record<SectionKey, number>>(
    Object.fromEntries(SECTIONS.map((s) => [s.key, 1])) as Record<SectionKey, number>
  );
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PackResult | null>(null);
  const [saveSummary, setSaveSummary] = useState<PersistPackSummary | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function toggleSection(key: SectionKey) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setCount(key: SectionKey, value: number) {
    const max = SECTIONS.find((s) => s.key === key)?.max ?? 20;
    setCounts((prev) => ({ ...prev, [key]: Math.max(0, Math.min(max, value)) }));
  }

  function setInput(key: string, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);
    setSaveSummary(null);
    setSaveError(null);

    try {
      const data = await apiFetch<PackResult>("/generate-pack", {
        method: "POST",
        body: {
          language: "fr",
          enabled,
          counts,
          inputs: Object.fromEntries(Object.entries(inputs).filter(([, v]) => v.trim())),
          description: description.trim() || undefined,
        },
      });
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Erreur lors de la génération.");
      } else {
        setError("Erreur inattendue. Vérifiez votre connexion.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;

    setSaving(true);
    setSaveError(null);
    setSaveSummary(null);

    try {
      const summary = await persistPackResult(apiFetch, result.result);
      setSaveSummary(summary);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur inattendue pendant l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen py-10 px-4 max-w-5xl mx-auto text-slate-900 dark:text-white bg-[#d4c5f9] dark:bg-transparent">
      <div className="mb-8 rounded-xl bg-white/95 dark:bg-transparent p-4 shadow-sm dark:shadow-none">
        <h1 className="text-3xl font-bold text-slate-950 dark:text-white mb-2" style={{ fontFamily: "Cinzel, serif" }}>
          <span className="text-amber-500 dark:text-amber-300">✨</span> Pack IA
        </h1>
        <p className="text-slate-600 dark:text-[#d4c5f9] opacity-90 text-sm">
          Remplissez les champs de votre choix, sélectionnez les sections à générer et cliquez sur{" "}
          <strong>Générer</strong>. L'IA complètera tout le reste.
        </p>
      </div>

      {/* ── Champs libres ──────────────────────────────────────────────────── */}
      <Card className="bg-white dark:bg-[#1a0d2e]/80 border border-slate-200 dark:border-[#7b3ff2]/30 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-[#e8b4f0] mb-4">Champs optionnels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INPUT_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <Label htmlFor={`input-${key}`} className="text-slate-700 dark:text-[#d4c5f9] text-xs font-medium">
                {label}
              </Label>
              <Input
                id={`input-${key}`}
                placeholder={placeholder}
                value={inputs[key] ?? ""}
                onChange={(e) => setInput(key, e.target.value)}
                className="bg-white dark:bg-[#2d1b4e]/60 border-slate-300 dark:border-[#7b3ff2]/40 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-[#7b3ff2]/50 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="description" className="text-slate-700 dark:text-[#d4c5f9] text-xs font-medium">
            Description libre (remplace ou complète les champs)
          </Label>
          <Textarea
            id="description"
            placeholder="ex: Un monde post-apocalyptique où des guildes de sorciers contrôlent les ressources rares..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 bg-white dark:bg-[#2d1b4e]/60 border-slate-300 dark:border-[#7b3ff2]/40 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-[#7b3ff2]/50 text-sm min-h-[80px]"
          />
        </div>
      </Card>

      {/* ── Sections à générer ─────────────────────────────────────────────── */}
      <Card className="bg-[#2d1b4e] border border-[#7b3ff2]/30 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#e8b4f0] mb-4">Sections à générer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTIONS.map(({ key, label, max }) => (
            <div
              key={key}
              className={`flex items-center justify-between rounded-lg px-4 py-3 border transition-colors ${
                enabled[key]
                  ? "bg-[#7b3ff2]/15 border-[#7b3ff2]/50"
                  : "bg-[#2d1b4e]/30 border-[#7b3ff2]/20 opacity-70"
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`chk-${key}`}
                  checked={enabled[key]}
                  onCheckedChange={() => toggleSection(key)}
                  className="border-[#7b3ff2] data-[state=checked]:bg-[#7b3ff2]"
                />
                <Label htmlFor={`chk-${key}`} className="text-white text-sm cursor-pointer">
                  {label}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#d4c5f9] text-xs opacity-80">max {max}</span>
                <Input
                  type="number"
                  min={0}
                  max={max}
                  value={counts[key]}
                  onChange={(e) => setCount(key, Number(e.target.value))}
                  disabled={!enabled[key]}
                  className="w-16 text-center bg-[#2d1b4e]/60 border-[#7b3ff2]/40 text-white text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Bouton Générer ─────────────────────────────────────────────────── */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-[#2d1b4e] hover:bg-[#24163d] text-white px-10 py-3 text-base font-semibold"
        >
          {loading ? "Génération en cours…" : "✨ Générer"}
        </Button>
      </div>

      {result && (
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            className="border-indigo-300 dark:border-[#7b3ff2] text-indigo-700 dark:text-[#d4c5f9] hover:bg-indigo-50 dark:hover:bg-[#7b3ff2]/20 px-10 py-3 text-base font-semibold"
          >
            {saving ? "Enregistrement en cours…" : "💾 Enregistrer en base"}
          </Button>
        </div>
      )}

      {/* ── Erreur ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      {saveError && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300 text-sm">
          {saveError}
        </div>
      )}

      {saveSummary && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30 text-emerald-200 text-sm">
          Enregistrement terminé: {saveSummary.created}/{saveSummary.attempted} créés, {saveSummary.failed} en échec.
        </div>
      )}

      {/* ── Résultats ─────────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-[#e8b4f0]">Résultats</h2>
            <Badge className="bg-indigo-100 dark:bg-[#7b3ff2]/30 text-indigo-800 dark:text-[#d4c5f9] border-indigo-200 dark:border-[#7b3ff2]/40 text-xs">
              {result.meta.model}
            </Badge>
          </div>

          {SECTIONS.map(({ key, label }) => (
            <SectionResult key={key} sectionKey={key} label={label} items={result.result[key] ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Composant résultat par section ────────────────────────────────────────────

function SectionResult({
  sectionKey,
  label,
  items,
}: {
  sectionKey: SectionKey;
  label: string;
  items: PackResultRow[];
}) {
  const columns = items.length > 0 ? Object.keys(items[0]) : [];

  return (
    <Card className="bg-white dark:bg-[#1a0d2e]/80 border border-slate-200 dark:border-[#7b3ff2]/30 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-[#e8b4f0]">{label}</h3>
        <Badge
          className={`text-xs ${
            items.length > 0
              ? "bg-indigo-100 dark:bg-[#7b3ff2]/20 text-indigo-800 dark:text-[#d4c5f9] border-indigo-200 dark:border-[#7b3ff2]/40"
              : "bg-slate-100 dark:bg-[#2d1b4e]/40 text-slate-500 dark:text-[#7b3ff2]/60 border-slate-200 dark:border-[#7b3ff2]/20"
          }`}
        >
          {items.length} élément{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-slate-500 dark:text-[#7b3ff2]/50 text-sm italic">Section désactivée ou vide.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#7b3ff2]/20">
                {columns.map((col) => (
                  <th key={col} className="py-2 pr-4 text-slate-700 dark:text-[#d4c5f9] font-medium capitalize">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-[#7b3ff2]/10 hover:bg-indigo-50/60 dark:hover:bg-[#7b3ff2]/5 transition-colors">
                  {Object.values(item).map((val, j) => (
                    <td key={j} className="py-2 pr-4 text-slate-800 dark:text-white align-top">
                      {String(val ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
