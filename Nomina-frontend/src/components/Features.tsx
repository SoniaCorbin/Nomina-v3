import { Card } from "./ui/card";
import { Wand2, BookOpen, Zap, Globe, Shield, Code } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useMemo, useState } from "react";

const features = [
  {
    icon: Wand2,
    title: "Génération intelligente",
    description: "Algorithmes avancés pour créer des noms uniques et mémorables adaptés à un univers narratif.",
    details: [
      "Choix du type (personnage / lieu / créature) et du genre.",
      "Préfixe optionnel (seed) pour guider la génération.",
      "Résultats cohérents avec le style de l’univers.",
    ],
  },
  {
    icon: BookOpen,
    title: "Narration intégrée",
    description: "Mini-biographies et descriptions narratives pour donner vie aux créations.",
    details: [
      "Génération d’une description courte (bio) en plus du nom.",
      "Style narratif configurable selon le contexte.",
      "Parfait pour amorcer des fiches de personnages et de lieux.",
    ],
  },
  {
    icon: Zap,
    title: "Rapide et fiable",
    description: "API haute performance avec temps de réponse < 100ms et disponibilité de 99.9%.",
    details: [
      "Réponses rapides pour une UX fluide dans l’app.",
      "Erreurs gérées proprement (messages clairs côté client).",
      "Pensé pour être stable en démo et en prod.",
    ],
  },
  {
    icon: Globe,
    title: "Multi-langues",
    description: "Support de plusieurs langues et cultures pour des noms authentiques et diversifiés.",
    details: [
      "Approche extensible: ajout de dictionnaires par langue.",
      "Variantes culturelles (sons, suffixes, styles).",
      "Idéal pour univers fantasy / SF / historique.",
    ],
  },
  {
    icon: Shield,
    title: "Sécurisé",
    description: "Infrastructure sécurisée avec authentification robuste et respect de la vie privée.",
    details: [
      "Authentification via Clerk (sessions / tokens).",
      "Routes protégées pour les opérations sensibles.",
      "Base de données accessible uniquement côté backend.",
    ],
  },
  {
    icon: Code,
    title: "Facile à intégrer",
    description: "Documentation complète, SDK disponibles et exemples de code pour démarrer rapidement.",
    details: [
      "Endpoints clairs et faciles à consommer.",
      "Exemples d’appels API depuis le client (Electron/React).",
      "Documentation lisible pour l’évaluation et la maintenance.",
    ],
  }
];

export function Features() {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selected = useMemo(() => {
    if (selectedIndex === null) return null;
    return features[selectedIndex] ?? null;
  }, [selectedIndex]);

  return (
    <section id="features" className="py-20 bg-[#f8f6fc]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl text-[#2d1b4e] mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
            Fonctionnalités puissantes
          </h2>
          <p className="text-lg text-[#c5bfd9] max-w-2xl mx-auto">
            Tout le nécessaire pour créer des noms et des histoires captivantes
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              role="button"
              tabIndex={0}
              aria-label={`Ouvrir les détails: ${feature.title}`}
              onClick={() => {
                setSelectedIndex(index);
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedIndex(index);
                  setOpen(true);
                }
              }}
              className="bg-white border-[#d4c5f9] p-6 hover:shadow-lg hover:shadow-[#7b3ff2]/10 transition-all duration-300 hover:border-[#7b3ff2] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7b3ff2]/40"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#7b3ff2] to-[#a67be8] rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl text-[#2d1b4e] mb-2">
                {feature.title}
              </h3>
              <p className="text-[#c5bfd9]">
                {feature.description}
              </p>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#7b3ff2] text-[#2d1b4e] hover:bg-[#7b3ff2]/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                    setOpen(true);
                  }}
                >
                  En savoir plus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSelectedIndex(null);
        }}
      >
        <DialogContent className="max-w-[560px] bg-[#1a0f33] border-[#7b3ff2]/30">
          <DialogHeader>
            <DialogTitle className="text-white" style={{ fontFamily: "Cinzel, serif" }}>
              {selected?.title ?? "Détails"}
            </DialogTitle>
          </DialogHeader>

          {selected ? (
            <div className="mt-2">
              <p className="text-[#d4c5f9]">{selected.description}</p>
              <ul className="mt-4 space-y-2 text-[#d4c5f9]/90">
                {selected.details.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#a67be8]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  className="bg-[#7b3ff2] hover:bg-[#a67be8] text-white"
                  onClick={() => setOpen(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
