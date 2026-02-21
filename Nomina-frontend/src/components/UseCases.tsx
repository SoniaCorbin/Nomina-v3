import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./nomina/imageWithFallback";

const useCases = [
  {
    title: "Développeurs de jeux",
    description: "Génération de milliers de PNJ avec des noms et des backstories uniques pour enrichir un univers de jeu.",
    image: "https://images.unsplash.com/photo-1595623654300-b27329804025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwY29kZSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYzNzI4MDc4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Gaming", "NPCs", "Worldbuilding"]
  },
  {
    title: "Auteurs et écrivains",
    description: "Inspiration pour les personnages avec des noms évocateurs accompagnés de mini-biographies.",
    image: "https://images.unsplash.com/photo-1726377240070-19b747fc9f19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwd3JpdGluZyUyMGNyZWF0aXZlfGVufDF8fHx8MTc2MzcyODA3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Écriture", "Fiction", "Personnages"]
  },
  {
    title: "Studios créatifs",
    description: "Accélération du processus créatif grâce à la génération rapide de concepts de noms pour les projets.",
    image: "https://images.unsplash.com/photo-1647529735399-c922b8c3f7c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdG9yeXRlbGxpbmclMjBib29rc3xlbnwxfHx8fDE3NjM3MjgwNzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["Design", "Branding", "Créativité"]
  }
];

export function UseCases() {
  return (
    <section
      id="usecases"
      className="py-20 bg-gradient-to-b from-[#f8f6fc] to-white dark:from-[#120b22] dark:to-[#0b0714]"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl text-[#2d1b4e] mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
            Cas d'usage
          </h2>
          <p className="text-lg text-[#c5bfd9] max-w-2xl mx-auto">
            Nomina s’adapte à de nombreux besoins créatifs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <Card 
              key={index}
              className="bg-white border-[#d4c5f9] overflow-hidden hover:shadow-xl hover:shadow-[#7b3ff2]/10 transition-all duration-300 group"
            >
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src={useCase.image}
                  alt={useCase.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d1b4e]/80 to-transparent"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl text-[#2d1b4e] mb-3">
                  {useCase.title}
                </h3>
                <p className="text-[#c5bfd9] mb-4">
                  {useCase.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {useCase.tags.map((tag, tagIndex) => (
                    <Badge 
                      key={tagIndex}
                      className="bg-[#d4c5f9] text-[#2d1b4e] hover:bg-[#a67be8]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
