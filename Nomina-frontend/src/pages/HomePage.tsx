import { Link } from "react-router-dom";
import { Features } from "../components/Features";
import { Pricing } from "../components/Pricing";
import { Documentation } from "../components/Documentation";
import logoClair from "../../assets/logoClair.jpg";
import { UseCases } from "../components/UseCases";

export function HomePage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-paper pt-16 pb-14 text-center relative">
        <div className="mx-auto max-w-3xl px-6">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 bg-wax-soft border border-wax/25 rounded-full px-4 py-1.5 mb-7">
            <span className="w-[5px] h-[5px] rounded-full bg-wax" />
            <span className="font-mono text-[10.5px] tracking-wide uppercase text-wax">
              Génération narrative · Design · Publicité
            </span>
          </div>

          {/* Logo */}
          <img
            src={logoClair}
            alt="Nomina"
            className="w-20 h-20 rounded-full object-cover mx-auto mb-6"
          />

          {/* Titre */}
          <h1 className="font-heading text-5xl md:text-7xl leading-[1.04] tracking-tight text-ink mx-auto max-w-[14ch]">
            Créez, nommez,{" "}
            <em className="italic text-wax">racontez.</em>
          </h1>

          {/* Sous-titre */}
          <p className="font-heading text-lg md:text-xl leading-relaxed text-ink-2 max-w-[54ch] mx-auto mt-6">
            Décris un monde, une marque, un personnage. Nomina génère les noms,
            les histoires et les identités — que tu écrives un roman, conçoives
            une campagne ou remplisses une maquette.
          </p>

          {/* CTA */}
          <div className="flex gap-3.5 justify-center mt-8">
            <Link
              to="/register"
              className="bg-wax hover:bg-wax-hover text-velin rounded-lg px-6 py-3 text-[15px] font-semibold transition-colors"
            >
              Commencer →
            </Link>
            <Link
              to="/docs"
              className="bg-transparent border border-rule-2 text-ink hover:bg-paper-2 rounded-lg px-6 py-3 text-[15px] font-medium transition-colors"
            >
              Voir la documentation
            </Link>
          </div>
        </div>

        {/* ── Preview card ── */}
        <div className="mx-auto max-w-[580px] mt-10 px-6">
          <div className="bg-velin border border-rule rounded-2xl shadow-[0_28px_60px_-44px_rgba(28,26,46,0.4)] text-left overflow-hidden">
            <div className="px-6 pt-5">
              <div className="font-heading text-lg text-ink">Génère un nom</div>
              <div className="text-[12.5px] text-ink-3 mt-0.5">
                Aperçu de l'atelier de génération.
              </div>
            </div>

            <div className="px-6 pt-4 pb-5 grid grid-cols-3 gap-3">
              <div>
                <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-1.5">Type</div>
                <div className="border border-rule rounded-lg px-3 py-2 text-[13px] text-ink bg-white flex justify-between items-center">
                  Personnage <span className="text-rule-2">⌄</span>
                </div>
              </div>
              <div>
                <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-1.5">Genre</div>
                <div className="border border-rule rounded-lg px-3 py-2 text-[13px] text-ink bg-white flex justify-between items-center">
                  Féminin <span className="text-rule-2">⌄</span>
                </div>
              </div>
              <div>
                <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-1.5">Préfixe</div>
                <div className="border border-rule rounded-lg px-3 py-2 text-[13px] text-ink-3 bg-white">
                  Ael · Nova…
                </div>
              </div>
            </div>

            <div className="px-6 pb-5 flex items-center gap-4">
              <span className="bg-wax text-velin rounded-lg px-5 py-2.5 text-[13.5px] font-semibold">
                Générer
              </span>
              <div>
                <div className="font-heading text-lg text-ink">Mira d'Or</div>
                <div className="text-[12.5px] text-ink-2">
                  Une archiviste fascinée par les noms anciens.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Qu'est-ce que Nomina ── */}
      <section className="py-16 bg-paper">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-heading text-3xl md:text-4xl text-ink text-center mb-3">
            Un atelier pour tes <em className="italic text-wax">idées</em>
          </h2>
          <p className="text-center text-sm text-ink-3 mb-10 max-w-[48ch] mx-auto">
            Que tu construises un récit, une identité visuelle ou une campagne — Nomina s'adapte à ton processus créatif.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Créer des univers",
                desc: "Pose les fondations d'un monde — ambiance, thèmes, repères. Nomina structure l'idée initiale.",
                tag: "Auteurs · Jeux",
              },
              {
                title: "Nommer avec style",
                desc: "Génération de noms adaptés (culture, sonorités, genre) pour garder la cohérence d'un chapitre à l'autre.",
                tag: "Auteurs · RPG",
              },
              {
                title: "Raconter en fragments",
                desc: "Micro-histoires, motivations et conflits pour alimenter intrigues et personnages secondaires.",
                tag: "Scénaristes",
              },
              {
                title: "Habiller une maquette",
                desc: "Personas, noms fictifs, profils utilisateurs et données d'exemple pour remplir tes wireframes et présentations.",
                tag: "UX · Pub · Design",
              },
            ].map(card => (
              <div
                key={card.title}
                className="bg-velin border border-rule rounded-2xl p-6 hover:border-rule-2 transition-colors flex flex-col"
              >
                <div className="h-[3px] w-12 rounded-full bg-wax" />
                <div className="mt-4 font-heading text-lg text-ink font-medium flex-1">
                  {card.title}
                </div>
                <p className="mt-2 text-sm text-ink-2 leading-relaxed flex-1">
                  {card.desc}
                </p>
                <div className="mt-4 font-mono text-[9.5px] tracking-wide uppercase text-wax/70">
                  {card.tag}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-3 justify-center">
            <Link
              to="/docs"
              className="border border-rule-2 text-ink rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-paper-2 transition-colors"
            >
              Lire la documentation
            </Link>
            <Link
              to="/generate"
              className="bg-wax hover:bg-wax-hover text-velin rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Lancer une génération
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sections existantes ── */}
      <Features />
      <UseCases />
      <Pricing />
      <Documentation />
    </div>
  );
}
