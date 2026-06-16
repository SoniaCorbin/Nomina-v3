import { Check } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "../lib/api";

const plans = [
  {
    id: "free",
    name: "Découverte",
    price: "0",
    description: "Pour tester et découvrir Nomina.",
    features: [
      "500 requêtes standard / mois",
      "10 requêtes IA / mois",
      "Personnages et lieux",
      "Support par courriel",
      "Documentation complète",
    ],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    id: "creator",
    name: "Créateur",
    price: "12",
    description: "Pour les créateurs indépendants.",
    features: [
      "10 000 requêtes standard / mois",
      "200 requêtes IA / mois",
      "Tous les types disponibles",
      "Génération avec biographies",
      "Support prioritaire",
      "Personnalisation avancée",
    ],
    cta: "Choisir Créateur",
    highlighted: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "49",
    description: "Pour les équipes et studios.",
    features: [
      "100 000 requêtes standard / mois",
      "2 000 requêtes IA / mois",
      "Tous les types — API dédiée",
      "Support 24/7 — SLA 99.9 %",
      "Formation et onboarding",
    ],
    cta: "Contacter l'équipe",
    highlighted: false,
  },
];

export function Pricing() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(planId: string) {
    if (!isSignedIn) return;
    setLoading(planId);
    try {
      const { url } = await apiFetch<{ url: string }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: planId }),
      });
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Erreur checkout:", err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="py-20 bg-paper">
      <div className="mx-auto max-w-5xl px-6">
        {/* ── En-tête ── */}
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl text-ink mb-2">
            Des tarifs <em className="italic text-wax">lisibles</em>
          </h2>
          <p className="text-ink-3 text-sm">
            Commence gratuitement. Change de plan quand ton monde grandit.
          </p>
        </div>

        {/* ── Cartes ── */}
        <div className="grid md:grid-cols-3 gap-4 items-stretch">
          {plans.map((plan) => {
            const isDark = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  isDark
                    ? "bg-ink border border-ink text-paper shadow-[0_24px_50px_-28px_rgba(28,26,46,0.5)]"
                    : "bg-velin border border-rule text-ink"
                }`}
              >
                {/* Badge populaire */}
                {isDark && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-wax text-velin font-mono text-[9px] tracking-wide uppercase px-3 py-1 rounded-full">
                      Populaire
                    </span>
                  </div>
                )}

                {/* Nom + description */}
                <div className="font-heading text-xl">{plan.name}</div>
                <div className={`text-[12.5px] mt-1 mb-4 ${isDark ? "text-ink-3" : "text-ink-3"}`}>
                  {plan.description}
                </div>

                {/* Prix */}
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="font-heading text-[44px] leading-none">
                    {plan.price}
                  </span>
                  <span className={`text-sm ${isDark ? "text-ink-3" : "text-ink-3"}`}>
                    $ / mois
                  </span>
                </div>

                {/* Features */}
                <div className="flex flex-col gap-2.5 mb-6 flex-1">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex gap-2 text-[13px]">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isDark ? "text-wax" : "text-sage"
                      }`} />
                      <span className={isDark ? "text-paper/90" : "text-ink-2"}>
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {plan.id === "free" ? (
                  <Link
                    to="/register"
                    className="text-center border border-rule-2 text-ink rounded-lg py-3 text-[13.5px] font-medium hover:bg-paper-2 transition-colors"
                  >
                    {plan.cta}
                  </Link>
                ) : plan.id === "studio" ? (
                  <a
                    href="mailto:contact@nomina.app"
                    className="text-center border border-rule-2 text-ink rounded-lg py-3 text-[13.5px] font-medium hover:bg-paper-2 transition-colors"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading === plan.id}
                    className={`text-center rounded-lg py-3 text-[13.5px] font-semibold transition-colors ${
                      isDark
                        ? "bg-wax hover:bg-wax-hover text-velin"
                        : "bg-wax hover:bg-wax-hover text-velin"
                    } disabled:opacity-60`}
                  >
                    {loading === plan.id ? "Redirection…" : plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="text-center mt-6 text-[13px] text-ink-3">
          Tous les plans payants sont facturés via Stripe — annulable à tout moment.
        </div>
      </div>
    </section>
  );
}