import { Wand2, BookOpen, Zap, Globe, Shield, Code } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useMemo, useState } from "react";

const features = [
  {
    icon: Wand2,
    title: "Génération intelligente",
    description: "Algorithmes avancés pour créer des noms uniques et mémorables adaptés à un univers narratif.",
    details: [
      "Choix du type (personnage, lieu, créature) et du genre.",
      "Préfixe optionnel pour guider la génération.",
      "Résultats cohérents avec le style de l'univers.",
    ],
  },
  {
    icon: BookOpen,
    title: "Narration intégrée",
    description: "Mini-biographies et descriptions narratives pour donner vie aux créations.",
    details: [
      "Génération d'une description courte en plus du nom.",
      "Style narratif configurable selon le contexte.",
      "Parfait pour amorcer des fiches de personnages et de lieux.",
    ],
  },
  {
    icon: Zap,
    title: "Rapide et fiable",
    description: "API haute performance avec temps de réponse rapide et disponibilité constante.",
    details: [
      "Réponses rapides pour une expérience fluide.",
      "Erreurs gérées proprement avec messages clairs.",
      "Stable en démo comme en production.",
    ],
  },
  {
    icon: Globe,
    title: "Multi-cultures",
    description: "Support de plusieurs cultures et sonorités pour des noms authentiques et diversifiés.",
    details: [
      "Approche extensible par dictionnaires culturels.",
      "Variantes de sons, suffixes et styles.",
      "Idéal pour univers fantasy, SF ou historique.",
    ],
  },
  {
    icon: Shield,
    title: "Sécurisé",
    description: "Infrastructure sécurisée avec authentification robuste et respect de la vie privée.",
    details: [
      "Authentification via Clerk (sessions et tokens).",
      "Routes protégées pour les opérations sensibles.",
      "Base de données accessible uniquement côté backend.",
    ],
  },
  {
    icon: Code,
    title: "Facile à intégrer",
    description: "Documentation complète et exemples de code pour démarrer en quelques minutes.",
    details: [
      "Endpoints clairs et faciles à consommer.",
      "Exemples d'appels API depuis React et Electron.",
      "Documentation lisible et à jour.",
    ],
  },
];

export function Features() {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = useMemo(() => {
    if (selectedIndex === null) return null;
    return features[selectedIndex] ?? null;
  }, [selectedIndex]);

  function openFeature(index: number) {
    setSelectedIndex(index);
    setOpen(true);
  }

  return (
    <section id="features" className="py-20 bg-paper-2">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-4xl text-ink mb-3">
            Ce que Nomina <em className="italic text-wax">sait faire</em>
          </h2>
          <p className="text-ink-3 max-w-2xl mx-auto">
            Tout le nécessaire pour créer des noms et des histoires captivantes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              role="button"
              tabIndex={0}
              aria-label={`Détails : ${feature.title}`}
              onClick={() => openFeature(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFeature(index);
                }
              }}
              className="bg-velin border border-rule rounded-2xl p-6 cursor-pointer transition-all hover:border-rule-2 hover:shadow-[0_8px_30px_-12px_rgba(28,26,46,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wax/40"
            >
              <div className="w-10 h-10 rounded-lg bg-paper-2 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-ink-3" />
              </div>
              <h3 className="font-heading text-lg text-ink font-medium mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-4">
                <span className="text-sm text-ink-blue font-medium hover:underline">
                  En savoir plus →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dialog détail ── */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSelectedIndex(null);
        }}
      >
        <DialogContent className="max-w-[520px] bg-ink border-rule-2/30">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-paper">
              {selected?.title ?? "Détails"}
            </DialogTitle>
          </DialogHeader>

          {selected ? (
            <div className="mt-2">
              <p className="text-ink-3 text-sm">{selected.description}</p>
              <ul className="mt-4 space-y-2.5">
                {selected.details.map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm">
                    <span className="mt-1.5 inline-block h-[5px] w-[5px] rounded-full bg-wax shrink-0" />
                    <span className="text-paper/90">{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="bg-wax hover:bg-wax-hover text-velin rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}