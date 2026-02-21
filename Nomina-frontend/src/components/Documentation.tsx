import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { BookOpen, Code, Puzzle, Rocket } from "lucide-react";
import { useMemo, useState } from "react";

const docSections = [
  {
    id: "docs-demarrage",
    icon: Rocket,
    title: "Démarrage rapide",
    description: "Lancer l’app et générer en ligne / hors‑ligne",
  },
  {
    id: "docs-api",
    icon: Code,
    title: "Référence API",
    description: "Endpoints, paramètres, formats de réponse",
  },
  {
    id: "docs-sdk",
    icon: Puzzle,
    title: "SDK & Bibliothèques",
    description: "Comment intégrer Nomina dans un projet",
  },
  {
    id: "docs-guides",
    icon: BookOpen,
    title: "Guides & Tutoriels",
    description: "Cas d’usage (personnage, univers, etc.)",
  }
];

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Documentation() {
  const [showDevExamples, setShowDevExamples] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const codeSnippets = useMemo(() => {
    const js = `// Exemple (Web)\n// Astuce: configure VITE_API_URL si besoin (ex: http://localhost:3000).\n\nconst baseUrl = 'http://localhost:3000';\n\nasync function generateNomPersonnages() {\n  const res = await fetch(baseUrl + '/generate/nom-personnages?count=3');\n  if (!res.ok) throw new Error('HTTP ' + res.status);\n  const data = await res.json();\n\n  // data: Array<{ nom: string; miniBio: string }>\n  console.log(data);\n}\n\ngenerateNomPersonnages();\n`;

    const python = `# Exemple (Python)\nimport requests\n\nbase_url = 'http://localhost:3001'\n\nr = requests.get(f"{base_url}/generate/nom-personnages", params={"count": 3})\nr.raise_for_status()\n\nfor item in r.json():\n    print(item["nom"])\n    print(item["miniBio"])\n    print('---')\n`;

    return { js, python };
  }, []);

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1200);
    } catch {
      // Clipboard peut être bloqué selon le contexte; on ne plante pas la page.
    }
  }

  return (
    <section
      id="docs"
      className="py-20 bg-gradient-to-b from-[#f8f6fc] to-white dark:from-[#120b22] dark:to-[#0b0714]"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl text-[#2d1b4e] mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
            Documentation
          </h2>
          <p className="text-lg text-[#c5bfd9] dark:text-[#b9b3cf] max-w-2xl mx-auto">
            Les informations essentielles pour intégrer Nomina
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {docSections.map((section, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className="text-left"
            >
              <Card className="bg-white dark:bg-[#120b22] border-[#d4c5f9] dark:border-[#2a1d45] p-6 hover:shadow-lg hover:shadow-[#7b3ff2]/10 transition-all duration-300 hover:border-[#7b3ff2] cursor-pointer group">
                <div className="w-12 h-12 bg-gradient-to-br from-[#7b3ff2] to-[#a67be8] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg text-[#2d1b4e] mb-2">{section.title}</h3>
                <p className="text-sm text-[#c5bfd9] dark:text-[#b9b3cf]">{section.description}</p>
              </Card>
            </button>
          ))}
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          <Card id="docs-demarrage" className="bg-white dark:bg-[#120b22] border-[#d4c5f9] dark:border-[#2a1d45] p-8">
            <h3 className="text-2xl text-[#2d1b4e] mb-3" style={{ fontFamily: "Cinzel, serif" }}>
              Démarrage rapide
            </h3>
            <div className="text-sm text-[#2d1b4e] space-y-3">
              <p>
                Objectif : lancer Nomina (web) et générer des contenus (personnages, univers, etc.).
                Pour les fonctionnalités qui appellent l’API, le backend doit aussi être démarré.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>Mode en ligne</b> : l’app appelle l’API du backend (Express + Prisma).</li>
                <li><b>Mode hors‑ligne</b> : les écritures peuvent être mises en attente (outbox) et rejouées au retour en ligne; la lecture dépend du cache.</li>
                <li><b>Génération</b> : page “Génération” → choix du type → génération.</li>
              </ul>
              <p className="text-[#6b5b8a] dark:text-[#b9b3cf]">
                Astuce : en cas d’erreurs réseau, vérifier que le backend tourne et que <code>VITE_API_URL</code>
                pointe vers la bonne URL.
              </p>
            </div>
          </Card>

          <Card id="docs-api" className="bg-white dark:bg-[#120b22] border-[#d4c5f9] dark:border-[#2a1d45] p-8">
            <h3 className="text-2xl text-[#2d1b4e] mb-3" style={{ fontFamily: "Cinzel, serif" }}>
              Référence API
            </h3>
            <div className="text-sm text-[#2d1b4e] space-y-3">
              <p>
                L’API expose des routes REST sous forme de endpoints <code>/generate/*</code>.
                Les réponses sont en JSON.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>GET</b> <code>/generate/nom-personnages</code> : génère une liste de noms + miniBio.</li>
                <li><b>Query</b> : <code>count</code> (optionnel) – nombre d’éléments à générer.</li>
                <li><b>Réponse</b> : <code>[{`{ nom: string, miniBio: string }`}]</code>.</li>
              </ul>

              <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[#6b5b8a] dark:text-[#b9b3cf]">
                  Les exemples de code sont disponibles en “mode développeur”.
                </p>
                <Button
                  variant="outline"
                  className="border-[#d4c5f9] dark:border-[#2a1d45] text-[#2d1b4e] hover:bg-[#7b3ff2]/10"
                  onClick={() => setShowDevExamples((v) => !v)}
                >
                  {showDevExamples ? "Masquer" : "Afficher"} les exemples de code
                </Button>
              </div>

              {showDevExamples && (
                <div className="mt-6 space-y-6">
                  <Card className="bg-[#2d1b4e] border-[#7b3ff2]/30 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-[#d4c5f9]">JavaScript</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#d4c5f9] hover:text-white hover:bg-[#7b3ff2]/20"
                        onClick={() => copyToClipboard(codeSnippets.js, "js")}
                      >
                        {copiedKey === "js" ? "Copié" : "Copier"}
                      </Button>
                    </div>
                    <div className="bg-[#1a0f33] rounded-lg p-4 overflow-x-auto">
                      <pre>
                        <code className="text-sm text-[#a67be8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {codeSnippets.js}
                        </code>
                      </pre>
                    </div>
                  </Card>

                  <Card className="bg-[#2d1b4e] border-[#7b3ff2]/30 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-[#d4c5f9]">Python</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#d4c5f9] hover:text-white hover:bg-[#7b3ff2]/20"
                        onClick={() => copyToClipboard(codeSnippets.python, "python")}
                      >
                        {copiedKey === "python" ? "Copié" : "Copier"}
                      </Button>
                    </div>
                    <div className="bg-[#1a0f33] rounded-lg p-4 overflow-x-auto">
                      <pre>
                        <code className="text-sm text-[#a67be8]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {codeSnippets.python}
                        </code>
                      </pre>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </Card>

          <Card id="docs-sdk" className="bg-white dark:bg-[#120b22] border-[#d4c5f9] dark:border-[#2a1d45] p-8">
            <h3 className="text-2xl text-[#2d1b4e] mb-3" style={{ fontFamily: "Cinzel, serif" }}>
              SDK & Bibliothèques
            </h3>
            <div className="text-sm text-[#2d1b4e] space-y-3">
              <p>
                Pour ce projet, il n’y a pas de SDK “officiel” publié (npm/pip).
                La raison est simple: l’API est un backend interne de projet (endpoints susceptibles d’évoluer),
                et publier un SDK implique du versioning, de la doc, des tests et une distribution.
                L’intégration se fait donc via des appels HTTP (fetch/axios côté JS, requests côté Python).
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><b>Web/React</b> : utilisation du helper déjà présent (<code>apiFetch</code>) pour centraliser base URL + token.</li>
                <li><b>Hors‑ligne</b> : les requêtes d’écriture peuvent être mises en attente (outbox) et rejouées au retour en ligne.</li>
                <li><b>Backend-to-backend</b> : même principe, juste une base URL différente.</li>
              </ul>
              <p className="text-[#6b5b8a] dark:text-[#b9b3cf]">
                Pour aller plus loin, il est possible de générer un “SDK” interne (TypeScript) ou un client à partir
                d’un contrat (ex: OpenAPI) — mais ce n’est pas nécessaire pour le cours.
              </p>
            </div>
          </Card>

          <Card id="docs-guides" className="bg-white dark:bg-[#120b22] border-[#d4c5f9] dark:border-[#2a1d45] p-8">
            <h3 className="text-2xl text-[#2d1b4e] mb-3" style={{ fontFamily: "Cinzel, serif" }}>
              Guides & Tutoriels
            </h3>
            <div className="text-sm text-[#2d1b4e] space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <b>Générer un personnage</b> : Page “Génération” → “Noms de personnages” → générer → copier/adapter.
                </li>
                <li>
                  <b>Travailler hors‑ligne</b> : si la connexion tombe, l’app peut mettre en file les actions d’écriture
                  (outbox). Les pages qui lisent des données via l’API nécessitent tout de même un backend accessible.
                </li>
                <li>
                  <b>Passer en ligne</b> : dès que le backend est accessible, l’outbox se resynchronise automatiquement.
                </li>
              </ul>
              <p className="text-[#6b5b8a] dark:text-[#b9b3cf]">
                Note : selon les pages, certaines fonctionnalités peuvent être limitées en mode hors‑ligne (normal).
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
