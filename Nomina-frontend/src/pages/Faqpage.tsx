import { useState } from "react";
import { Link } from "react-router-dom";

type FAQItem = { q: string; a: string };
type FAQSection = { title: string; items: FAQItem[] };

const FAQ_DATA: FAQSection[] = [
  {
    title: "Général",
    items: [
      {
        q: "C'est quoi Nomina ?",
        a: "Nomina est une plateforme de génération narrative propulsée par l'IA. Elle vous permet de créer des personnages, des lieux, des noms, des fragments d'histoire et bien plus — en quelques secondes. Nomina est conçue pour les auteurs, les concepteurs de jeux et toute personne qui bâtit des univers fictifs.",
      },
      {
        q: "À qui s'adresse Nomina ?",
        a: "Aux auteurs de romans, de nouvelles et de scénarios. Aux concepteurs de jeux de rôle, de jeux vidéo et de jeux de société. Aux designers UX/UI qui ont besoin de personas et de noms fictifs pour leurs maquettes. Aux agences publicitaires et directeurs artistiques qui cherchent des noms de marques, de personnages ou de campagnes. À toute personne qui crée — que ce soit un univers fictif ou une identité commerciale.",
      },
      {
        q: "Est-ce que Nomina fonctionne hors ligne ?",
        a: "Les lectures (consultation des listes existantes) sont disponibles hors ligne grâce au cache local. Les générations IA et les écritures (créer, modifier, supprimer) nécessitent une connexion. Les actions effectuées hors ligne sont mises en attente et synchronisées automatiquement au retour en ligne.",
      },
    ],
  },
  {
    title: "Génération",
    items: [
      {
        q: "Comment générer un personnage ?",
        a: "Rendez-vous sur la page Génération, sélectionnez « Personnage complet (bio) », entrez des mots-clés si vous le souhaitez, choisissez le nombre souhaité, puis cliquez sur Générer. L'IA produit un prénom, un nom de famille, une occupation et une biographie pour chaque personnage.",
      },
      {
        q: "C'est quoi la différence entre « Prénom » et « Personnage complet » ?",
        a: "« Prénom » génère uniquement des prénoms, idéal pour alimenter une liste rapidement. « Personnage complet » génère un profil narratif complet : prénom, nom, occupation, biographie et traits distinctifs. Utilisez le mode complet quand vous avez besoin d'un personnage prêt à jouer.",
      },
      {
        q: "C'est quoi le Pack IA ?",
        a: "Le Pack IA génère en une seule opération un ensemble cohérent d'éléments narratifs : personnages, lieux, organisations, événements, créatures, titres et concepts. C'est l'outil idéal pour créer la fondation d'un univers complet d'un seul coup.",
      },
      {
        q: "Combien d'éléments puis-je générer à la fois ?",
        a: "Vous pouvez générer jusqu'à 200 éléments par requête sur la page Génération. Sur le Pack IA, chaque section a sa propre limite (jusqu'à 20 fragments d'histoire, 20 titres, etc.). Les limites totales dépendent de votre plan.",
      },
      {
        q: "Les noms générés sont-ils uniques ?",
        a: "L'IA produit des combinaisons originales à chaque génération, mais l'unicité absolue n'est pas garantie. Si un nom correspond à un personnage existant dans votre base, c'est une coïncidence — Nomina ne vérifie pas les conflits avec des œuvres tierces.",
      },
    ],
  },
  {
    title: "Compte & Facturation",
    items: [
      {
        q: "Est-ce que Nomina est gratuit ?",
        a: "Oui, un plan gratuit est disponible. Il inclut 500 requêtes de génération par mois, l'accès à toutes les fonctionnalités de base et un stockage illimité de vos données narratives.",
      },
      {
        q: "C'est quoi la limite du plan gratuit ?",
        a: "Le plan gratuit inclut 500 requêtes IA par mois. Au-delà, vous pouvez passer au plan Créateur (500 req supplémentaires, 12 $ CAD/mois) ou au plan Studio (requêtes illimitées, 49 $ CAD/mois).",
      },
      {
        q: "Comment annuler mon abonnement ?",
        a: "Rendez-vous dans votre tableau de bord → Paramètres → Facturation. Cliquez sur « Gérer l'abonnement » pour accéder au portail Stripe et annuler à tout moment. L'accès au plan payant reste actif jusqu'à la fin de la période en cours.",
      },
      {
        q: "Est-ce que je peux changer de plan ?",
        a: "Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis votre tableau de bord. Le changement est immédiat et le montant est calculé au prorata.",
      },
    ],
  },
  {
    title: "Technique",
    items: [
      {
        q: "L'API est-elle publique ?",
        a: "L'API Nomina est accessible aux abonnés des plans Créateur et Studio. Elle expose des routes REST sous /api/generate/* et retourne du JSON. Une documentation complète est disponible sur la page Documentation.",
      },
      {
        q: "Comment intégrer Nomina dans mon application ?",
        a: "Utilisez le helper apiFetch (Web/React) ou tout client HTTP standard (fetch, axios, requests). Configurez VITE_API_URL vers votre instance backend. Des exemples de code sont disponibles sur la page Documentation → mode développeur.",
      },
      {
        q: "Mes données sont-elles sauvegardées ?",
        a: "Toutes vos données (personnages, lieux, univers, etc.) sont stockées dans une base de données sécurisée. Les données ne sont jamais partagées avec d'autres utilisateurs. Vous pouvez exporter ou supprimer vos données à tout moment depuis votre tableau de bord.",
      },
    ],
  },
];

export function FAQPage() {
  const [open, setOpen] = useState<string | null>(null);

  function toggle(key: string) {
    setOpen((prev) => (prev === key ? null : key));
  }

  return (
    <main className="min-h-screen bg-paper">
      {/* ── Hero ── */}
      <div className="bg-ink border-b border-rule/20 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-wax mb-3">
            Aide
          </p>
          <h1 className="font-heading text-4xl text-paper mb-4">
            Questions fréquentes
          </h1>
          <p className="text-paper/60 text-[15px] leading-relaxed">
            Tout ce qu'il faut savoir pour utiliser Nomina efficacement.
          </p>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="space-y-12">
          {FAQ_DATA.map((section) => (
            <div key={section.title}>
              {/* En-tête section */}
              <h2 className="font-mono text-[10px] tracking-[0.18em] uppercase text-wax mb-5">
                {section.title}
              </h2>

              {/* Questions */}
              <div className="space-y-1">
                {section.items.map((item, idx) => {
                  const key = `${section.title}-${idx}`;
                  const isOpen = open === key;
                  return (
                    <div
                      key={key}
                      className={`border rounded-xl overflow-hidden transition-colors ${
                        isOpen ? "border-rule-2 bg-velin" : "border-rule bg-velin/60"
                      }`}
                    >
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                      >
                        <span className="font-heading text-[15px] text-ink pr-4">
                          {item.q}
                        </span>
                        <span
                          className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-full border transition-all ${
                            isOpen
                              ? "border-wax text-wax rotate-45"
                              : "border-rule-2 text-ink-3"
                          }`}
                        >
                          <svg viewBox="0 0 10 10" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <line x1="5" y1="1" x2="5" y2="9" />
                            <line x1="1" y1="5" x2="9" y2="5" />
                          </svg>
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5">
                          <div className="h-px bg-rule mb-4" />
                          <p className="text-sm text-ink-2 leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Contact ── */}
        <div className="mt-16 border border-rule rounded-2xl p-8 text-center">
          <h3 className="font-heading text-xl text-ink mb-2">
            Vous n'avez pas trouvé votre réponse ?
          </h3>
          <p className="text-sm text-ink-3 mb-5">
            Notre équipe répond généralement dans les 24 heures.
          </p>
          <a
            href="mailto:contact@nomina.app"
            className="inline-block bg-wax hover:bg-wax-hover text-velin rounded-lg px-6 py-2.5 text-[13.5px] font-semibold transition-colors"
          >
            Contacter le support
          </a>
        </div>

        {/* ── Retour ── */}
        <div className="mt-10 text-center">
          <Link to="/" className="text-sm text-ink-blue hover:underline">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
