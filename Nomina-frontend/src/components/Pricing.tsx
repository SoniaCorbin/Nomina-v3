import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Découverte",
    price: "0",
    description: "Pour tester et découvrir Nomina",
    features: [
      "1 000 requêtes/mois",
      "Types de base (personnages, lieux)",
      "Support par email",
      "Documentation complète"
    ],
    cta: "Commencer gratuitement",
    highlighted: false
  },
  {
    name: "Créateur",
    price: "29",
    description: "Pour les créateurs indépendants",
    features: [
      "50 000 requêtes/mois",
      "Tous les types disponibles",
      "Génération avec biographies",
      "Support prioritaire",
      "Multi-langues",
      "Personnalisation avancée"
    ],
    cta: "Choisir Créateur",
    highlighted: true
  },
  {
    name: "Studio",
    price: "149",
    description: "Pour les équipes et studios",
    features: [
      "500 000 requêtes/mois",
      "Tous les types illimités",
      "API dédiée",
      "Support 24/7",
      "Personnalisation complète",
      "SLA 99.9%",
      "Formation et onboarding"
    ],
    cta: "Contacter l'équipe",
    highlighted: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl text-[#2d1b4e] mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
            Tarifs transparents
          </h2>
          <p className="text-lg text-[#c5bfd9] max-w-2xl mx-auto">
            Sélection du plan correspondant aux besoins
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`p-8 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-[#7b3ff2] to-[#a67be8] border-[#7b3ff2] shadow-xl shadow-[#7b3ff2]/20 scale-105'
                  : 'bg-[#f8f6fc] border-[#d4c5f9]'
              }`}
            >
              {plan.highlighted && (
                <div className="text-center mb-4">
                  <span className="inline-block bg-[#e8b4f0] text-[#2d1b4e] px-3 py-1 rounded-full text-sm">
                    Populaire
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3
                  className={`text-2xl mb-2 ${
                    plan.highlighted ? 'text-white' : 'text-[#2d1b4e]'
                  }`}
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-[#d4c5f9]' : 'text-[#c5bfd9]'}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span
                    className={`text-5xl ${
                      plan.highlighted ? 'text-white' : 'text-[#7b3ff2]'
                    }`}
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    {plan.price}
                  </span>
                  <span className={plan.highlighted ? 'text-[#d4c5f9]' : 'text-[#c5bfd9]'}>$/mois</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check
                      className={`w-5 h-5 flex-shrink-0 ${
                        plan.highlighted ? 'text-[#e8b4f0]' : 'text-[#a67be8]'
                      }`}
                    />
                    <span className={plan.highlighted ? 'text-white' : 'text-[#2d1b4e]'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.highlighted
                    ? 'bg-white text-[#7b3ff2] hover:bg-[#f8f6fc]'
                    : 'bg-[#7b3ff2] text-white hover:bg-[#a67be8]'
                }`}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-[#c5bfd9]">
            Besoin d'un plan sur mesure ?{" "}
            <a href="#contact" className="text-[#7b3ff2] hover:text-[#a67be8]">
              Contactez-nous
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
