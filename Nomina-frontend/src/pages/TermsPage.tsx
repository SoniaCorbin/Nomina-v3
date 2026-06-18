import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <main className="min-h-screen bg-paper">
      {/* ── Hero ── */}
      <div className="bg-ink border-b border-rule/20 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-wax mb-3">
            Légal
          </p>
          <h1 className="font-heading text-4xl text-paper mb-4">
            Conditions d'utilisation
          </h1>
          <p className="text-paper/60 text-[15px]">
            Dernière mise à jour : juin 2026
          </p>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="space-y-10">

          <Section title="1. Acceptation des conditions">
            <p>
              En accédant à Nomina ou en créant un compte, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, vous ne pouvez pas utiliser le service. Ces conditions constituent un contrat entre vous et <strong>Corbin Creative Tech Inc.</strong>
            </p>
          </Section>

          <Section title="2. Description du service">
            <p>
              Nomina est une plateforme de génération narrative assistée par intelligence artificielle. Elle permet de créer des personnages, des lieux, des noms, des fragments d'histoire et d'autres éléments narratifs via une interface web et une API REST.
            </p>
          </Section>

          <Section title="3. Admissibilité">
            <p>
              Vous devez avoir au moins 13 ans pour utiliser Nomina. Si vous utilisez Nomina dans le cadre d'une organisation, vous déclarez avoir l'autorité pour engager cette organisation.
            </p>
          </Section>

          <Section title="4. Votre compte">
            <ul>
              <li>Vous êtes responsable de la confidentialité de vos identifiants de connexion.</li>
              <li>Vous devez nous informer immédiatement de tout accès non autorisé à votre compte.</li>
              <li>Vous ne pouvez pas créer de compte pour le compte d'une autre personne sans son autorisation.</li>
              <li>Un compte par personne physique sur le plan gratuit.</li>
            </ul>
          </Section>

          <Section title="5. Utilisation acceptable">
            <p>Vous vous engagez à ne pas utiliser Nomina pour :</p>
            <ul>
              <li>Générer du contenu illégal, haineux, diffamatoire ou portant atteinte aux droits de tiers.</li>
              <li>Contourner les limites de quota ou les mécanismes de sécurité.</li>
              <li>Effectuer des appels API automatisés excessifs qui nuisent à la performance du service.</li>
              <li>Revendre ou redistribuer l'accès à Nomina sans autorisation écrite.</li>
              <li>Tenter d'accéder aux données d'autres utilisateurs.</li>
            </ul>
          </Section>

          <Section title="6. Propriété intellectuelle">
            <p>
              <strong>Votre contenu :</strong> Vous conservez tous les droits sur les éléments narratifs que vous créez et stockez dans Nomina. En utilisant le service, vous nous accordez une licence limitée pour stocker et traiter ce contenu afin de vous fournir le service.
            </p>
            <p>
              <strong>Notre plateforme :</strong> Le code, le design, les marques et la documentation de Nomina appartiennent à Corbin Creative Tech Inc. Vous ne pouvez pas copier, modifier ou distribuer ces éléments sans autorisation.
            </p>
            <p>
              <strong>Contenu généré par l'IA :</strong> Les éléments générés par l'IA sont fournis sans garantie d'originalité. Vous êtes responsable de vérifier que le contenu généré ne viole pas les droits de tiers avant toute utilisation commerciale.
            </p>
          </Section>

          <Section title="7. Plans et facturation">
            <ul>
              <li>Le plan gratuit inclut 500 requêtes IA par mois, renouvelées le premier jour de chaque mois.</li>
              <li>Les plans payants sont facturés mensuellement via Stripe.</li>
              <li>Les frais sont non remboursables sauf obligation légale contraire.</li>
              <li>Nous nous réservons le droit de modifier les tarifs avec un préavis de 30 jours.</li>
              <li>Le non-paiement entraîne la suspension du compte après une période de grâce de 7 jours.</li>
            </ul>
          </Section>

          <Section title="8. Disponibilité du service">
            <p>
              Nous visons une disponibilité maximale mais ne garantissons pas un service ininterrompu. Des maintenances programmées sont annoncées à l'avance dans la mesure du possible. Nous ne sommes pas responsables des interruptions causées par des tiers (hébergeurs, fournisseurs d'IA, etc.).
            </p>
          </Section>

          <Section title="9. Limitation de responsabilité">
            <p>
              Dans toute la mesure permise par la loi, Corbin Creative Tech Inc. ne peut être tenu responsable des dommages indirects, accessoires ou consécutifs découlant de l'utilisation ou de l'impossibilité d'utiliser Nomina. Notre responsabilité totale est limitée au montant que vous avez payé au cours des 3 derniers mois.
            </p>
          </Section>

          <Section title="10. Résiliation">
            <p>
              Vous pouvez résilier votre compte à tout moment depuis votre tableau de bord. Nous pouvons suspendre ou résilier votre accès en cas de violation des présentes conditions, avec ou sans préavis selon la gravité de la violation. En cas de résiliation, vos données sont conservées 30 jours avant suppression définitive.
            </p>
          </Section>

          <Section title="11. Droit applicable">
            <p>
              Ces conditions sont régies par les lois de la province de Québec et les lois fédérales du Canada applicables. Tout litige sera soumis à la compétence exclusive des tribunaux du Québec.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              Pour toute question : <a href="mailto:contact@nomina.app" className="text-wax hover:underline">contact@nomina.app</a>
            </p>
            <p>
              Corbin Creative Tech Inc.<br />
              Québec, Canada
            </p>
          </Section>

        </div>

        {/* ── Navigation ── */}
        <div className="mt-16 pt-8 border-t border-rule flex flex-wrap gap-6 justify-center">
          <Link to="/privacy" className="text-sm text-ink-blue hover:underline">
            Politique de confidentialité →
          </Link>
          <Link to="/faq" className="text-sm text-ink-blue hover:underline">
            FAQ →
          </Link>
          <Link to="/" className="text-sm text-ink-3 hover:underline">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-xl text-ink mb-4">{title}</h2>
      <div className="space-y-3 text-sm text-ink-2 leading-relaxed [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-ink [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
