import { ImageWithFallback } from "./nomina/imageWithFallback";

const useCases = [
  {
    title: "Développeurs de jeux",
    description: "Génération de milliers de PNJ avec des noms et des backstories uniques pour enrichir un univers de jeu.",
    image: "https://images.unsplash.com/photo-1595623654300-b27329804025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwY29kZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYzNzI4MDc4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Gaming", "NPCs", "Worldbuilding"],
  },
  {
    title: "Auteurs et écrivains",
    description: "Inspiration pour les personnages avec des noms évocateurs accompagnés de mini-biographies narratives.",
    image: "https://images.unsplash.com/photo-1726377240070-19b747fc9f19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwd3JpdGluZyUyMGNyZWF0aXZlfGVufDF8fHx8MTc2MzcyODA3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Écriture", "Fiction", "Personnages"],
  },
  {
    title: "Studios créatifs",
    description: "Accélération du processus créatif grâce à la génération rapide de concepts de noms pour les projets.",
    image: "https://images.unsplash.com/photo-1647529735399-c922b8c3f7c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yeXRlbGxpbmclMjBib29rc3xlbnwxfHx8fDE3NjM3MjgwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Design", "Branding", "Créativité"],
  },
];

export function UseCases() {
  return (
    <section id="usecases" className="py-20 bg-paper-2">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-4xl text-ink mb-3">
            Qui utilise <em className="italic text-wax">Nomina</em> ?
          </h2>
          <p className="text-ink-3 max-w-2xl mx-auto">
            Nomina s'adapte à de nombreux besoins créatifs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
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