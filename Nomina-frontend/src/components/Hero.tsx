import { Button } from "./ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Link } from "react-router-dom";

export function Hero() {
  const [kind, setKind] = useState<"character" | "place" | "creature">(
    "character",
  );
  const [genre, setGenre] = useState<"masculin" | "feminin" | "neutre">("masculin");
  const [seed, setSeed] = useState("");
  const [withBio, setWithBio] = useState(true);

  const [result, setResult] = useState<{ name: string; bio?: string } | null>(
    null,
  );

    const dictionaries = useMemo(
    () => ({
      character: {
        masculin: {
          first: ["Ael", "Kael", "Ery", "Soren", "Théo", "Atlas", "Orion", "Zed"],
          last: ["d'Or", "Nuit", "Brume", "Val", "Lune", "Cendre", "Prime", "Helix"],
          bio: [
            "un voyageur discret au passé trouble",
            "un duelliste réputé dans les ruelles de la cité",
            "un pilote de cargo qui ne fait confiance qu'à ses capteurs",
            "un ingénieur qui répare tout, sauf ses regrets",
            "un messager au service d'un pacte oublié",
            "un gardien lié à une étoile mourante",
          ],
        },
        feminin: {
          first: ["Lys", "Mira", "Nova", "Aria", "Iris", "Astra", "Eos"],
          last: ["d'Or", "Nuit", "Brume", "Val", "Lune", "Cendre", "-7", "Kappa", "Sable"],
          bio: [
            "une archiviste fascinée par les noms anciens",
            "une analyste de données qui parle en probabilités",
            "une prêtresse qui lit les signes dans la fumée",
            "une pilote renommée aux mille trajets",
            "une guerrière silencieuse aux cicatrices éloquentes",
          ],
        },
        neutre: {
          first: ["Vex", "Kai", "Nyx", "Ash", "Lux", "Sol", "Echo"],
          last: ["Vector", "d'Éther", "des Vents", "du Serment", "des Oracles", "-noir"],
          bio: [
            "un être mystérieux qui ne parle qu'en énigmes",
            "une entité liée aux anciennes prophéties",
            "un gardien des frontières entre les mondes",
            "une conscience artificielle en quête d'humanité",
          ],
        },
      },
      place: {
        masculin: {
          first: ["Mont", "Roc", "Port", "Dôme", "Nexus", "Sanctuaire", "Temple"],
          last: ["-noir", "-clair", "Epsilon", "Delta", "Oméga", "des-Échos"],
          bio: [
            "un avant-poste minier au bord de la ceinture",
            "un hub commercial où chaque porte a un prix",
            "un lieu sacré qui change avec la lune",
            "un hameau perché où le vent raconte des légendes",
          ],
        },
        feminin: {
          first: ["Val", "Brise", "Aube", "Station", "Colonie", "Grotte", "Île", "Forêt"],
          last: ["-claire", "-d'Azur", "-des-Épines", "-sur-Lune", "Astra", "Kepler", "des-Miroirs"],
          bio: [
            "une cité portuaire aux lanternes éternelles",
            "une base de recherche sous surveillance constante",
            "une oasis cachée dans les dunes temporelles",
            "une vallée où les échos durent des années",
          ],
        },
        neutre: {
          first: ["Sombre", "Nexus", "Echo", "Horizon", "Portail"],
          last: ["-noir", "-d'Ombre", "Prime", "des-Serments", "du-Zéphyr"],
          bio: [
            "des ruines dont les murs chuchotent des noms",
            "un passage caché entre deux mythes",
            "un domaine interdit où l'on perd son nom",
            "un lieu hors du temps où tout recommence",
          ],
        },
      },
      creature: {
        masculin: {
          first: ["Grif", "Drak", "Xeno", "Proto", "Serp", "Atlas"],
          last: ["-aile", "-crocs", "-écaille", "drone", "organisme", "-bère"],
          bio: [
            "un prédateur silencieux aux yeux d'ambre",
            "un gardien des clairières interdites",
            "un organisme adaptatif qui apprend en observant",
            "un esprit qui protège les noms vrais",
          ],
        },
        feminin: {
          first: ["Syl", "Umbra", "Fae", "Bio", "Harp", "Chim", "Ném"],
          last: ["-brume", "-ombre", "forme", "spectre", "-ère", "-entine", "-ésis"],
          bio: [
            "une créature nocturne attirée par les promesses",
            "une entité qui perturbe les communications",
            "une bête liée à un ancien interdit",
            "une gardienne des seuils oubliés",
          ],
        },
        neutre: {
          first: ["Morn", "Cryo", "Nano", "Cér", "Echo", "Void"],
          last: ["-spectre", "hôte", "-ie", "-forme", "Prime"],
          bio: [
            "un échantillon échappé d'un labo clandestin",
            "un symbole vivant d'un destin brisé",
            "une anomalie qui défie toute classification",
            "une présence qui observe sans juger",
          ],
        },
      },
    }),
    [],
  );

  function randomPick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generate() {
    const dict = dictionaries[kind][genre];
    const left = seed.trim() ? seed.trim() : randomPick(dict.first);
    const right = randomPick(dict.last);
    const name = `${left}${right}`;
    const bio = withBio ? `C’est ${randomPick(dict.bio)}.` : undefined;
    setResult({ name, bio });
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#2d1b4e] via-[#1a0f33] to-[#2d1b4e] py-20 md:py-32">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#7b3ff2] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#a67be8] rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7b3ff2]/20 border border-[#7b3ff2]/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-[#e8b4f0]" />
            <span className="text-sm text-[#d4c5f9]">API de génération narrative</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl text-white mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
            Créez, Nommez, Racontez
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-[#d4c5f9] mb-8 max-w-2xl mx-auto">
            Une API innovante dédiée à la narration et à la création de contenu à partir de quelques mots. 
            Créez des personnages, des lieux et des créatures avec des histoires captivantes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button asChild size="lg" className="bg-[#7b3ff2] hover:bg-[#a67be8] text-white px-8 gap-2">
              <Link to="/register">
                S’inscrire
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-[#7b3ff2] text-[#d4c5f9] hover:bg-[#7b3ff2]/20">
              <Link to="/docs">Voir la documentation</Link>
            </Button>
          </div>

          <p className="text-sm text-[#d4c5f9] -mt-8 mb-12">
            Compte existant ?{" "}
            <Link to="/login" className="text-[#e8b4f0] hover:underline">
              Se connecter
            </Link>
          </p>

          {/* Mini UI: Générateur */}
          <Card className="bg-[#f8f6fc] border-[#d4c5f9] shadow-xl shadow-[#7b3ff2]/10 max-w-2xl mx-auto text-left">
            <CardHeader>
              <CardTitle className="text-[#2d1b4e]" style={{ fontFamily: "Cinzel, serif" }}>
                Générer un nom
              </CardTitle>
              <p className="text-sm text-[#c5bfd9]">
                Aperçu de l’interface de génération.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-[#2d1b4e]">Type</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as typeof kind)}
                    className="mt-2 w-full h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
                  >
                    <option value="character">Personnage</option>
                    <option value="place">Lieu</option>
                    <option value="creature">Créature</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-[#2d1b4e]">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as typeof genre)}
                    className="mt-2 w-full h-9 rounded-md border border-[#d4c5f9] bg-white px-3 text-sm"
                  >
                    <option value="masculin">Masculin</option>
                    <option value="feminin">Féminin</option>
                    <option value="neutre">Neutre</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-[#2d1b4e]">Préfixe (optionnel)</label>
                  <Input
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Ex: Ael / Nova / Val"
                    className="mt-2 border-[#d4c5f9] bg-white"
                  />
                </div>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-[#2d1b4e]">
                <input
                  type="checkbox"
                  checked={withBio}
                  onChange={(e) => setWithBio(e.target.checked)}
                />
                Ajouter une mini-description
              </label>

              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button
                  onClick={generate}
                  className="bg-[#7b3ff2] hover:bg-[#a67be8] text-white"
                >
                  Générer
                </Button>
                {result ? (
                  <div>
                    <div className="text-[#2d1b4e] font-semibold">{result.name}</div>
                    {result.bio ? (
                      <div className="text-sm text-[#6b5aa3]">{result.bio}</div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-[#c5bfd9]">
                    Un exemple apparaît après génération.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
