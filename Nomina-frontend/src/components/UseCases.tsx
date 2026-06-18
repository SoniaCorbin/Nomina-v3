import { ImageWithFallback } from "./nomina/imageWithFallback";

const useCases = [
  {
    title: "Auteurs et écrivains",
    description: "Inspiration pour les personnages avec des noms évocateurs accompagnés de mini-biographies narratives. Du prénom au nom de famille, en passant par la biographie complète.",
    image: "https://images.unsplash.com/photo-1726377240070-19b747fc9f19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwd3JpdGluZyUyMGNyZWF0aXZlfGVufDF8fHx8MTc2MzcyODA3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Écriture", "Fiction", "Personnages"],
  },
  {
    title: "Développeurs de jeux",
    description: "Génération de milliers de PNJ avec des noms et des backstories uniques pour enrichir un univers de jeu. Cohérence culturelle garantie d'un bout à l'autre du monde.",
    image: "https://images.unsplash.com/photo-1595623654300-b27329804025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwY29kZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYzNzI4MDc4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Gaming", "NPCs", "Worldbuilding"],
  },
  {
    title: "Designers UX/UI",
    description: "Personas fictifs, noms d'utilisateurs et profils complets pour remplir tes maquettes et wireframes. Fini les 'Lorem Ipsum' dans tes présentations clients.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tags: ["UX", "Maquettes", "Personas"],
  },
  {
    title: "Agences publicitaires",
    description: "Noms de marques fictives, personnages de campagne et identités narratives pour les briefs créatifs, les pitchs et les présentations clients.",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tags: ["Publicité", "Branding", "Campagnes"],
  },
  {
    title: "Studios créatifs",
    description: "Accélération du processus créatif grâce à la génération rapide de concepts de noms pour les projets de direction artistique, d'identité visuelle et de naming.",
    image: "https://images.unsplash.com/photo-1647529735399-c922b8c3f7c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yeXRlbGxpbmclMjBib29rc3xlbnwxfHx8fDE3NjM3MjgwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Design", "Naming", "Créativité"],
  },
  {
    title: "Concepteurs de jeux de rôle",
    description: "Univers cohérents, titres nobiliaires, organisations secrètes et fragments d'histoire pour alimenter tes campagnes et tes supplements de jeu.",
    image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    tags: ["JDR", "Campagnes", "Lore"],
  },
];

export function UseCases() {
  return (
    <section id="usecases" className="py-20 bg-paper-2">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-4xl text-ink mb-3">
            Qui utilise <em className="italic text-wax">Nomina</em> ?
          </h2>
          <p className="text-ink-3 max-w-2xl mx-auto">
            Des auteurs aux agences, Nomina s'adapte à tous les processus créatifs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {useCases.map((uc, i) => (
            <div
              key={i}
              className="bg-velin border border-rule rounded-2xl overflow-hidden hover:border-rule-2 hover:shadow-[0_12px_40px_-16px_rgba(28,26,46,0.18)] transition-all group"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <ImageWithFallback
                  src={uc.image}
                  alt={uc.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <h3 className="absolute bottom-3 left-4 font-heading text-lg text-paper font-medium">
                  {uc.title}
                </h3>
              </div>

              {/* Contenu */}
              <div className="p-5">
                <p className="text-sm text-ink-2 leading-relaxed mb-4">
                  {uc.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {uc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-paper-2 text-ink-3 rounded px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
