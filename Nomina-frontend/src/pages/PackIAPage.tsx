import { useState } from "react";
import { apiFetch, ApiError } from "../lib/api";
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

interface PackResult {
  meta: { language: string; model: string };
  result: Record<SectionKey, unknown[]>;
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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PackResult | null>(null);

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

  return (
    <div className="min-h-screen py-10 px-4 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Cinzel, serif" }}>
          ✨ Pack IA
        </h1>
        <p className="text-[#d4c5f9] opacity-80 text-sm">
          Remplissez les champs de votre choix, sélectionnez les sections à générer et cliquez sur{" "}
          <strong>Générer</strong>. L'IA complètera tout le reste.
        </p>
      </div>

      {/* ── Champs libres ──────────────────────────────────────────────────── */}
      <Card className="bg-[#1a0d2e]/80 border border-[#7b3ff2]/30 p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#e8b4f0] mb-4">Champs optionnels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INPUT_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <Label htmlFor={`input-${key}`} className="text-[#d4c5f9] text-xs">
                {label}
              </Label>
              <Input
                id={`input-${key}`}
                placeholder={placeholder}
                value={inputs[key] ?? ""}
                onChange={(e) => setInput(key, e.target.value)}
                className="bg-[#2d1b4e]/60 border-[#7b3ff2]/40 text-white placeholder:text-[#7b3ff2]/50 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="description" className="text-[#d4c5f9] text-xs">
            Description libre (remplace ou complète les champs)
          </Label>
          <Textarea
            id="description"
            placeholder="ex: Un monde post-apocalyptique où des guildes de sorciers contrôlent les ressources rares..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 bg-[#2d1b4e]/60 border-[#7b3ff2]/40 text-white placeholder:text-[#7b3ff2]/50 text-sm min-h-[80px]"
          />
        </div>
      </Card>

      {/* ── Sections à générer ─────────────────────────────────────────────── */}
      <Card className="bg-[#1a0d2e]/80 border border-[#7b3ff2]/30 p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#e8b4f0] mb-4">Sections à générer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTIONS.map(({ key, label, max }) => (
            <div
              key={key}
              className={`flex items-center justify-between rounded-lg px-4 py-3 border transition-colors ${
                enabled[key]
                  ? "bg-[#7b3ff2]/10 border-[#7b3ff2]/50"
                  : "bg-[#2d1b4e]/20 border-[#7b3ff2]/20 opacity-60"
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
                <span className="text-[#d4c5f9] text-xs opacity-60">max {max}</span>
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
          className="bg-[#7b3ff2] hover:bg-[#a67be8] text-white px-10 py-3 text-base font-semibold"
        >
          {loading ? "Génération en cours…" : "✨ Générer"}
        </Button>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* ── Résultats ─────────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-semibold text-[#e8b4f0]">Résultats</h2>
            <Badge className="bg-[#7b3ff2]/30 text-[#d4c5f9] border-[#7b3ff2]/40 text-xs">
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
  items: unknown[];
}) {
  return (
    <Card className="bg-[#1a0d2e]/80 border border-[#7b3ff2]/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-semibold text-[#e8b4f0]">{label}</h3>
        <Badge
          className={`text-xs ${
            items.length > 0
              ? "bg-[#7b3ff2]/20 text-[#d4c5f9] border-[#7b3ff2]/40"
              : "bg-[#2d1b4e]/40 text-[#7b3ff2]/60 border-[#7b3ff2]/20"
          }`}
        >
          {items.length} élément{items.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {items.length === 0 ? (
        <p className="text-[#7b3ff2]/50 text-sm italic">Section désactivée ou vide.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#7b3ff2]/20">
                {Object.keys(items[0] as object).map((col) => (
                  <th key={col} className="py-2 pr-4 text-[#d4c5f9] font-medium capitalize">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-[#7b3ff2]/10 hover:bg-[#7b3ff2]/5 transition-colors">
                  {Object.values(item as object).map((val, j) => (
                    <td key={j} className="py-2 pr-4 text-white align-top">
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
