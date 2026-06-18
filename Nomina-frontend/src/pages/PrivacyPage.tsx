import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper">
      {/* ── Hero ── */}
      <div className="bg-ink border-b border-rule/20 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-wax mb-3">
            Légal
          </p>
          <h1 className="font-heading text-4xl text-paper mb-4">
            Politique de confidentialité
          </h1>
          <p className="text-paper/60 text-[15px]">
            Dernière mise à jour : juin 2026
          </p>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="prose-nomina space-y-10">

          <Section title="1. Qui sommes-nous ?">
            <p>
              Nomina est un service exploité par <strong>Corbin Creative Tech Inc.</strong>, société incorporée au Canada (fédéral) et inscrite au Registre des entreprises du Québec (REQ). Notre adresse de correspondance est disponible sur demande à <a href="mailto:contact@nomina.app" className="text-wax hover:underline">contact@nomina.app</a>.
            </p>
          </Section>

          <Section title="2. Quelles données collectons-nous ?">
            <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
            <ul>
              <li><strong>Données de compte</strong> — nom d'utilisateur, adresse courriel, rôle.</li>
              <li><strong>Données de facturation</strong> — traitées directement par Stripe. Nomina ne stocke jamais vos informations de carte de crédit.</li>
              <li><strong>Données narratives</strong> — les personnages, lieux, univers et autres éléments que vous créez dans Nomina.</li>
              <li><strong>Données d'utilisation</strong> — nombre de requêtes IA, horodatages des connexions, logs d'erreurs techniques.</li>
            </ul>
          </Section>

          <Section title="3. Comment utilisons-nous vos données ?">
            <ul>
              <li>Fournir et améliorer le service Nomina.</li>
              <li>Gérer votre abonnement et votre quota de génération.</li>
              <li>Vous envoyer des communications liées au service (confirmations, alertes de quota, mises à jour importantes).</li>
              <li>Détecter et prévenir les abus et les accès non autorisés.</li>
            </ul>
            <p>Nous n'utilisons pas vos données narratives pour entraîner des modèles d'IA tiers.</p>
          </Section>

          <Section title="4. Partage des données">
            <p>Nous ne vendons jamais vos données personnelles. Nous partageons uniquement avec :</p>
            <ul>
              <li><strong>Stripe</strong> — pour le traitement des paiements.</li>
              <li><strong>Clerk</strong> — pour l'authentification sécurisée.</li>
              <li><strong>Anthropic</strong> — pour les générations IA (les requêtes sont anonymisées autant que possible).</li>
              <li><strong>Supabase / Neon</strong> — pour l'hébergement de la base de données.</li>
            </ul>
            <p>Ces fournisseurs sont contractuellement tenus de protéger vos données et de ne pas les utiliser à d'autres fins.</p>
          </Section>

          <Section title="5. Conservation des données">
            <p>
              Vos données sont conservées aussi longtemps que votre compte est actif. Si vous supprimez votre compte, vos données personnelles sont effacées dans un délai de 30 jours. Les données de facturation sont conservées conformément aux obligations légales (7 ans au Québec).
            </p>
          </Section>

          <Section title="6. Vos droits">
            <p>Conformément à la Loi 25 (Québec) et aux lois canadiennes sur la protection des renseignements personnels, vous avez le droit de :</p>
            <ul>
              <li>Accéder aux données personnelles que nous détenons sur vous.</li>
              <li>Demander la correction de données inexactes.</li>
              <li>Demander la suppression de votre compte et de vos données.</li>
              <li>Retirer votre consentement au traitement de vos données.</li>
            </ul>
            <p>Pour exercer ces droits, écrivez-nous à <a href="mailto:contact@nomina.app" className="text-wax hover:underline">contact@nomina.app</a>.</p>
          </Section>

          <Section title="7. Cookies et traçage">
            <p>
              Nomina utilise uniquement les cookies strictement nécessaires au fonctionnement du service (session d'authentification, préférences d'interface). Nous n'utilisons pas de cookies publicitaires ou de traçage tiers.
            </p>
          </Section>

          <Section title="8. Sécurité">
            <p>
              Nous appliquons des mesures de sécurité standards : chiffrement HTTPS, authentification sécurisée via Clerk, accès à la base de données restreint. Aucun système n'est infaillible — en cas de brèche affectant vos données, nous vous en informerons dans les délais requis par la loi.
            </p>
          </Section>

          <Section title="9. Modifications">
            <p>
              Nous pouvons modifier cette politique à tout moment. Les changements importants seront communiqués par courriel ou par une notification dans l'application. La date de dernière mise à jour figure en haut de cette page.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Pour toute question relative à cette politique : <a href="mailto:contact@nomina.app" className="text-wax hover:underline">contact@nomina.app</a>
            </p>
            <p>
              Corbin Creative Tech Inc.<br />
              Québec, Canada
            </p>
          </Section>

        </div>

        {/* ── Navigation ── */}
        <div className="mt-16 pt-8 border-t border-rule flex flex-wrap gap-6 justify-center">
          <Link to="/terms" className="text-sm text-ink-blue hover:underline">
            Conditions d'utilisation →
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
