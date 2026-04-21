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
import logoUrl from "../../assets/logo5.png";

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
    <div className="min-h-screen py-10 px-4 max-w-[1400px] mx-auto text-[#2d1b4e] bg-[#e9e2ff]">
      <div className="mb-8 rounded-xl bg-white p-4 shadow-sm border border-[#d4c5f9]">
        <h1 className="text-3xl font-bold text-[#2d1b4e] mb-2" style={{ fontFamily: "Cinzel, serif" }}>
          <span className="text-[#f0b4e8]">✨</span> Pack IA
        </h1>
        <p className="text-[#6b5aa3] opacity-90 text-sm">
          Remplissez les champs de votre choix, sélectionnez les sections à générer et cliquez sur{" "}
          <strong>Générer</strong>. L'IA complètera tout le reste.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 items-start">
        <div className="space-y-6">
          {/* ── Champs libres ──────────────────────────────────────────────── */}
          <Card className="bg-white border border-[#d4c5f9] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2d1b4e] mb-4" style={{ fontFamily: "Cinzel, serif" }}>
              ✨ Champs optionnels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INPUT_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <Label htmlFor={`input-${key}`} className="text-[#2d1b4e] text-xs font-medium">
                    {label}
                  </Label>
                  <Input
                    id={`input-${key}`}
                    placeholder={placeholder}
                    value={inputs[key] ?? ""}
                    onChange={(e) => setInput(key, e.target.value)}
                    className="bg-white border-[#d4c5f9] text-[#2d1b4e] placeholder:text-[#6b5aa3] text-sm"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Label htmlFor="description" className="text-[#2d1b4e] text-xs font-medium">
                Description libre (remplace ou complète les champs)
              </Label>
              <Textarea
                id="description"
                placeholder="ex: Un monde post-apocalyptique où des guildes de sorciers contrôlent les ressources rares..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 bg-white border-[#d4c5f9] text-[#2d1b4e] placeholder:text-[#6b5aa3] text-sm min-h-[120px]"
              />
            </div>
          </Card>

          {/* ── Sections à générer ─────────────────────────────────────────── */}
          <Card className="bg-[#2d1b4e] border border-[#7b3ff2]/40 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#e8b4f0] mb-4" style={{ fontFamily: "Cinzel, serif" }}>
              ✨ Sections à générer
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {SECTIONS.map(({ key, label, max }) => (
                <div
                  key={key}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 border transition-colors ${
                    enabled[key]
                      ? "bg-[#7b3ff2]/15 border-[#7b3ff2]/50"
                      : "bg-[#2d1b4e]/30 border-[#7b3ff2]/20 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      id={`chk-${key}`}
                      checked={enabled[key]}
                      onCheckedChange={() => toggleSection(key)}
                      className="border-[#7b3ff2] data-[state=checked]:bg-[#7b3ff2]"
                    />
                    <Label htmlFor={`chk-${key}`} className="text-white text-sm cursor-pointer leading-tight">
                      {label}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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

          {/* ── Actions et messages ────────────────────────────────────────── */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-[#7b3ff2] hover:bg-[#a67be8] text-white px-10 py-3 text-base font-semibold"
            >
              {loading ? "Génération en cours…" : "✨ Générer"}
            </Button>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {saveError && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {saveError}
            </div>
          )}

          {saveSummary && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              Enregistrement terminé: {saveSummary.created}/{saveSummary.attempted} créés, {saveSummary.failed} en échec.
            </div>
          )}
        </div>

        {/* ── Résultats à droite (comme GeneratePage) ───────────────────── */}
        <Card className="bg-white border border-[#d4c5f9] p-5 shadow-sm xl:sticky xl:top-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {result ? (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#7b3ff2]">Résultats</span>
                <h2 className="text-xl font-semibold text-[#2d1b4e]" style={{ fontFamily: "Cinzel, serif" }}>
                  ✨ Résultats narratifs
                </h2>
                <Badge className="bg-[#d4c5f9] text-[#2d1b4e] border-[#a67be8] text-xs">
                  {result.meta.model}
                </Badge>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  variant="outline"
                  className="ml-auto border-[#d4c5f9] text-[#2d1b4e] hover:bg-[#f8f6fc] px-4 py-2 text-sm font-semibold"
                >
                  {saving ? "Enregistrement en cours…" : "💾 Enregistrer en base"}
                </Button>
              </div>

              <p className="text-sm text-[#6b5aa3] mb-4">Éléments générés pour enrichir l'univers</p>

              <div className="space-y-4">
                {SECTIONS.map(({ key, label }) => (
                  <SectionResult key={key} sectionKey={key} label={label} items={result.result[key] ?? []} />
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center py-16 bg-gradient-to-br from-white to-[#f8f6fc] border-2 border-dashed border-[#d4c5f9] rounded-lg">
              <div>
                <p className="text-[#6b5aa3] text-sm">Les éléments générés apparaîtront ici.</p>
                <p className="text-[#a67be8] text-xs mt-2">
                  Lance une génération depuis le panneau de gauche.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
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
  const getItemTitle = (item: PackResultRow): string => {
    const fromName = [item.prenom, item.nomFamille]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" ")
      .trim();

    const titleCandidate =
      fromName ||
      (typeof item.name === "string" ? item.name : null) ||
      (typeof item.nom === "string" ? item.nom : null) ||
      (typeof item.valeur === "string" ? item.valeur : null) ||
      (typeof item.value === "string" ? item.value : null) ||
      (typeof item.title === "string" ? item.title : null) ||
      null;

    return titleCandidate && titleCandidate.trim().length > 0 ? titleCandidate : "Élément généré";
  };

  const getDisplayFields = (item: PackResultRow): Array<{ key: string; value: string }> => {
    const hiddenKeys = new Set(["name", "nom", "prenom", "nomFamille", "valeur", "value", "title"]);
    const fields: Array<{ key: string; value: string }> = [];

    for (const [key, rawValue] of Object.entries(item)) {
      if (hiddenKeys.has(key)) continue;
      if (rawValue === null || rawValue === undefined) continue;
      const value = String(rawValue).trim();
      if (!value) continue;
      fields.push({ key, value });
      if (fields.length >= 6) break;
    }

    return fields;
  };

  return (
    <Card className="bg-white border border-[#d4c5f9] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-semibold text-[#2d1b4e]" style={{ fontFamily: "Cinzel, serif" }}>{label}</h3>
        <Badge
          className={`text-xs ${
            items.length > 0
              ? "bg-[#d4c5f9] text-[#2d1b4e] border-[#a67be8]"
              : "bg-[#f8f6fc] text-[#6b5aa3] border-[#d4c5f9]"
          }`}
        >
          {items.length} élément{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-[#6b5aa3] text-sm italic">Section désactivée ou vide.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((item, index) => {
            const title = getItemTitle(item);
            const fields = getDisplayFields(item);

            return (
              <div
                key={index}
                className="bg-white border border-[#d4c5f9] rounded-lg p-4 overflow-hidden hover:shadow-xl hover:shadow-[#7b3ff2]/10 transition-all duration-300 group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-9 w-9 rounded-full bg-[#f8f6fc] border border-[#d4c5f9] flex items-center justify-center shrink-0">
                    <img src={logoUrl} alt="Nomina" className="h-6 w-6 object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#7b3ff2] text-white text-xs font-semibold shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-[#2d1b4e] break-words" style={{ fontFamily: "Cinzel, serif" }}>
                        {title}
                      </p>
                    </div>
                  </div>
                </div>

                {fields.length > 0 ? (
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div key={field.key} className="text-xs text-[#2d1b4e]">
                        <span className="font-semibold capitalize text-[#7b3ff2]">{field.key}:</span>{" "}
                        <span className="text-[#5b4a7f]">{field.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6b5aa3] italic">Aucun détail supplémentaire.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
