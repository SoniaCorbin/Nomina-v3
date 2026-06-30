import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
import { persistPackResult, type PersistPackSummary } from "../lib/packPersistence";
import { Checkbox } from "../components/ui/checkbox";

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
  { key: "personnages",       label: "Personnages",          max: 5  },
  { key: "lieux",             label: "Lieux",                max: 10 },
  { key: "organizations",     label: "Organisations",        max: 10 },
  { key: "events",            label: "Événements",           max: 10 },
  { key: "creatures",         label: "Créatures",            max: 10 },
  { key: "fragmentsHistoire", label: "Fragments d'histoire", max: 20 },
  { key: "titres",            label: "Titres",               max: 20 },
  { key: "concepts",          label: "Concepts",             max: 20 },
];

const INPUT_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "personnage",       label: "Personnage",        placeholder: "ex : guerrière elfique solitaire" },
  { key: "prenom",           label: "Prénom",            placeholder: "ex : Aeryn"                      },
  { key: "nomFamille",       label: "Nom de famille",    placeholder: "ex : Solcrest"                   },
  { key: "occupation",       label: "Occupation",        placeholder: "ex : archère, alchimiste"        },
  { key: "categorie",        label: "Catégorie",         placeholder: "ex : fantasy, médiéval"          },
  { key: "concept",          label: "Concept",           placeholder: "ex : trahison, rédemption"       },
  { key: "creature",         label: "Créature",          placeholder: "ex : draconide, golem"           },
  { key: "event",            label: "Événement",         placeholder: "ex : bataille, couronnement"     },
  { key: "lieux",            label: "Lieux",             placeholder: "ex : forêt maudite, cité flottante" },
  { key: "organization",     label: "Organisation",      placeholder: "ex : guilde des ombres"          },
  { key: "classeSociale",    label: "Classe sociale",    placeholder: "ex : noble, roturier"            },
  { key: "titre",            label: "Titre",             placeholder: "ex : Grand Maître, Archimage"    },
  { key: "universThematique",label: "Univers thématique",placeholder: "ex : steampunk, lovecraftien"    },
];

// ── Styles réutilisables ───────────────────────────────────────────────────────

const inputCls =
  "w-full border border-rule rounded-lg bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:border-wax focus:ring-1 focus:ring-wax/30";
const labelCls = "font-mono text-[9.5px] tracking-wide uppercase text-ink-3 block mb-1.5";

// ── Composant principal ────────────────────────────────────────────────────────

export function PackIAPage() {
  const [enabled, setEnabled] = useState<Record<SectionKey, boolean>>(
    Object.fromEntries(SECTIONS.map((s) => [s.key, true])) as Record<SectionKey, boolean>
  );
  const [counts, setCounts] = useState<Record<SectionKey, number>>(
    Object.fromEntries(SECTIONS.map((s) => [s.key, 1])) as Record<SectionKey, number>
  );
  const [inputs, setInputs]       = useState<Record<string, string>>({});
  const [description, setDescription] = useState("");
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<PackResult | null>(null);
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
      setSaveError(
        err instanceof Error ? err.message : "Erreur inattendue pendant l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-6 bg-paper">
      {/* ── En-tête ── */}
      <div className="mb-6">
        <h1 className="font-heading text-3xl text-ink mb-1">Pack IA</h1>
        <p className="text-sm text-ink-3">
          Remplissez les champs de votre choix, sélectionnez les sections à générer et cliquez sur{" "}
          <strong className="text-ink-2">Générer</strong>. L'IA complètera tout le reste.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 items-start">
        {/* ── Colonne gauche ── */}
        <div className="space-y-5">

          {/* Champs optionnels */}
          <div className="bg-velin border border-rule rounded-2xl p-5">
            <h2 className="font-heading text-lg text-ink mb-4">Champs optionnels</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INPUT_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    placeholder={placeholder}
                    value={inputs[key] ?? ""}
                    onChange={(e) => setInput(key, e.target.value)}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <label className={labelCls}>Description libre (remplace ou complète les champs)</label>
              <textarea
                placeholder="ex : Un monde post-apocalyptique où des guildes de sorciers contrôlent les ressources rares…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`${inputCls} min-h-[120px] resize-y`}
              />
            </div>
          </div>

          {/* Sections à générer */}
          <div className="bg-ink border border-ink/80 rounded-2xl p-5">
            <h2 className="font-heading text-lg text-velin mb-4">Sections à générer</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {SECTIONS.map(({ key, label, max }) => (
                <div
                  key={key}
                  className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 border transition-colors ${
                    enabled[key]
                      ? "bg-ink-2/10 border-rule-2/40"
                      : "bg-ink/60 border-rule-2/20 opacity-60"
                  }`}
                >
                  <Checkbox
                    id={`section-${key}`}
                    checked={enabled[key]}
                    onCheckedChange={() => toggleSection(key)}
                    className="border-velin/50 data-[state=checked]:bg-wax data-[state=checked]:border-wax"
                  />
                  <label
                    htmlFor={`section-${key}`}
                    className="flex-1 text-[13px] text-velin cursor-pointer select-none"
                  >
                    {label}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={counts[key]}
                    onChange={(e) => setCount(key, Number(e.target.value))}
                    disabled={!enabled[key]}
                    className="w-14 text-center rounded border border-rule-2/30 bg-white text-ink text-sm px-1.5 py-1 focus:outline-none focus:border-wax disabled:opacity-40"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bouton générer */}
          <div className="flex justify-center">
            <button
              onClick={() => handleGenerate().catch(() => undefined)}
              disabled={loading}
              className="bg-wax hover:bg-wax-hover text-velin px-10 py-3 rounded-lg text-[13.5px] font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Génération en cours…" : "Générer"}
            </button>
          </div>

          {/* Messages d'état */}
          {error && (
            <p className="text-sm text-crit bg-crit/8 border border-crit/25 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
          {saveError && (
            <p className="text-sm text-crit bg-crit/8 border border-crit/25 rounded-lg px-4 py-3">
              {saveError}
            </p>
          )}
          {saveSummary && (
            <p className="text-sm text-sage bg-sage/8 border border-sage/25 rounded-lg px-4 py-3">
              Enregistrement terminé : {saveSummary.created}/{saveSummary.attempted} créés,{" "}
              {saveSummary.failed} en échec.
            </p>
          )}
        </div>

        {/* ── Colonne droite : résultats ── */}
        <div className="bg-velin border border-rule rounded-2xl p-5 xl:sticky xl:top-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {result ? (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="font-heading text-lg text-ink">Résultats narratifs</h2>
                <span className="font-mono text-[10px] tracking-wide uppercase text-ink-3 border border-rule rounded px-2 py-0.5">
                  {result.meta.model}
                </span>
                <button
                  onClick={() => handleSave().catch(() => undefined)}
                  disabled={saving}
                  className="ml-auto border border-rule text-ink-2 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold hover:bg-paper transition-colors disabled:opacity-50"
                >
                  {saving ? "Enregistrement…" : "Enregistrer en base"}
                </button>
              </div>
              <p className="text-xs text-ink-3 mb-4">Éléments générés pour enrichir l'univers</p>

              <div className="space-y-4">
                {SECTIONS.map(({ key, label }) => (
                  <SectionResult
                    key={key}
                    sectionKey={key}
                    label={label}
                    items={result.result[key] ?? []}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center py-16 border-2 border-dashed border-rule rounded-xl">
              <div>
                <p className="text-ink-3 text-sm">Les éléments générés apparaîtront ici.</p>
                <p className="text-ink-3/60 text-xs mt-1.5">
                  Lance une génération depuis le panneau de gauche.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ── SectionResult ─────────────────────────────────────────────────────────────

function SectionResult({
  label,
  items,
}: {
  sectionKey: SectionKey;
  label: string;
  items: PackResultRow[];
}) {
  const getItemTitle = (item: PackResultRow): string => {
    const fromName = [item.prenom, item.nomFamille]
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .join(" ")
      .trim();

    const candidate =
      fromName ||
      (typeof item.name   === "string" ? item.name   : null) ||
      (typeof item.nom    === "string" ? item.nom    : null) ||
      (typeof item.valeur === "string" ? item.valeur : null) ||
      (typeof item.value  === "string" ? item.value  : null) ||
      (typeof item.title  === "string" ? item.title  : null) ||
      null;

    return candidate?.trim() || "Élément généré";
  };

  const getDisplayFields = (item: PackResultRow): { key: string; value: string }[] => {
    const hidden = new Set(["name", "nom", "prenom", "nomFamille", "valeur", "value", "title"]);
    const fields: { key: string; value: string }[] = [];
    for (const [k, raw] of Object.entries(item)) {
      if (hidden.has(k) || raw == null) continue;
      const v = String(raw).trim();
      if (!v) continue;
      fields.push({ key: k, value: v });
      if (fields.length >= 6) break;
    }
    return fields;
  };

  return (
    <div className="bg-white border border-rule rounded-xl p-4">
      {/* En-tête section */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-heading text-[15px] text-ink">{label}</h3>
        <span
          className={`font-mono text-[10px] tracking-wide px-2 py-0.5 rounded border ${
            items.length > 0
              ? "text-wax border-wax/30 bg-wax-soft"
              : "text-ink-3 border-rule bg-velin"
          }`}
        >
          {items.length} élément{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-ink-3 italic">Section désactivée ou vide.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {items.map((item, index) => {
            const title  = getItemTitle(item);
            const fields = getDisplayFields(item);

            return (
              <div
                key={index}
                className="border border-rule/60 rounded-lg p-3.5 hover:bg-velin transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-wax text-velin text-[10px] font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <p className="font-heading text-[13.5px] text-ink">{title}</p>
                </div>

                {fields.length > 0 ? (
                  <div className="space-y-1">
                    {fields.map((field) => (
                      <div key={field.key} className="text-xs text-ink-2">
                        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-3">
                          {field.key}:
                        </span>{" "}
                        {field.value}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-3 italic">Aucun détail supplémentaire.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
