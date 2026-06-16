import { BookOpen, Code, Puzzle, Rocket } from "lucide-react";
import { useMemo, useState } from "react";

const docSections = [
  { id: "docs-demarrage", icon: Rocket, title: "Démarrage rapide", description: "Lancer l'app et générer en ligne / hors-ligne" },
  { id: "docs-api", icon: Code, title: "Référence API", description: "Endpoints, paramètres, formats de réponse" },
  { id: "docs-sdk", icon: Puzzle, title: "SDK & Bibliothèques", description: "Comment intégrer Nomina dans un projet" },
  { id: "docs-guides", icon: BookOpen, title: "Guides & Tutoriels", description: "Cas d'usage (personnage, univers, etc.)" },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Documentation() {
  const [showDevExamples, setShowDevExamples] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const codeSnippets = useMemo(() => ({
    js: `// Exemple (Web)
const baseUrl = 'https://nomina.fly.dev/api';

async function generateNoms() {
  const res = await fetch(baseUrl + '/generate/nom-personnages?count=3');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  console.log(data); // [{ nom, miniBio }]
}

generateNoms();`,
    python: `# Exemple (Python)
import requests

base_url = 'https://nomina.fly.dev/api'

r = requests.get(f"{base_url}/generate/nom-personnages", params={"count": 3})
r.raise_for_status()

for item in r.json():
    print(item["nom"], "—", item["miniBio"])`,
  }), []);

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    } catch { /* clipboard blocked */ }
  }

  return (
    <section id="docs" className="py-20 bg-paper">
      <div className="mx-auto max-w-5xl px-6">
        {/* ── En-tête ── */}
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-4xl text-ink mb-3">
            Documentation
          </h2>
          <p className="text-ink-3 max-w-2xl mx-auto">
            Les informations essentielles pour intégrer Nomina.
          </p>
        </div>

        {/* ── Navigation rapide ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {docSections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollToSection(s.id)}
              className="text-left bg-velin border border-rule rounded-xl p-5 hover:border-rule-2 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-paper-2 flex items-center justify-center mb-3 group-hover:bg-wax-soft transition-colors">
                <s.icon className="w-4 h-4 text-ink-3 group-hover:text-wax transition-colors" />
              </div>
              <h3 className="font-heading text-base text-ink font-medium mb-1">{s.title}</h3>
              <p className="text-xs text-ink-3">{s.description}</p>
            </button>
          ))}
        </div>

        {/* ── Sections ── */}
        <div className="space-y-6">
          {/* Démarrage rapide */}
          <div id="docs-demarrage" className="bg-velin border border-rule rounded-xl p-7">
            <h3 className="font-heading text-xl text-ink mb-3">Démarrage rapide</h3>
            <div className="text-sm text-ink-2 space-y-3">
              <p>
                Objectif : lancer Nomina et générer des contenus (personnages, univers, etc.).
                Pour les fonctionnalités qui appellent l'API, le backend doit aussi être démarré.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Mode en ligne</strong> — l'app appelle l'API du backend (Express + Prisma).</li>
                <li><strong>Mode hors-ligne</strong> — les écritures sont mises en attente (outbox) et rejouées au retour en ligne.</li>
                <li><strong>Génération</strong> — page Génération → choix du type → lancer.</li>
              </ul>
              <p className="text-ink-3 text-xs">
                Astuce : en cas d'erreurs réseau, vérifier que le backend tourne et que <code className="font-mono bg-paper-2 px-1.5 py-0.5 rounded">VITE_API_URL</code> pointe vers la bonne URL.
              </p>
            </div>
          </div>

          {/* Référence API */}
          <div id="docs-api" className="bg-velin border border-rule rounded-xl p-7">
            <h3 className="font-heading text-xl text-ink mb-3">Référence API</h3>
            <div className="text-sm text-ink-2 space-y-3">
              <p>
                L'API expose des routes REST sous <code className="font-mono bg-paper-2 px-1.5 py-0.5 rounded">/api/generate/*</code>. Les réponses sont en JSON.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>GET</strong> <code className="font-mono bg-paper-2 px-1.5 py-0.5 rounded">/api/generate/nom-personnages</code> — génère des noms + mini-biographies.</li>
                <li><strong>Query</strong> : <code className="font-mono bg-paper-2 px-1.5 py-0.5 rounded">count</code> (optionnel) — nombre d'éléments.</li>
                <li><strong>Réponse</strong> : <code className="font-mono bg-paper-2 px-1.5 py-0.5 rounded">{`[{ nom, miniBio }]`}</code></li>
              </ul>

              <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-ink-3 text-xs">
                  Les exemples de code sont disponibles en mode développeur.
                </p>
                <button
                  className="text-sm text-ink-blue font-medium hover:underline"
                  onClick={() => setShowDevExamples((v) => !v)}
                >
                  {showDevExamples ? "Masquer" : "Afficher"} les exemples →
                </button>
              </div>

              {showDevExamples && (
                <div className="mt-5 space-y-4">
                  {(["js", "python"] as const).map((lang) => (
                    <div key={lang} className="bg-ink rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule/15">
                        <span className="font-mono text-xs text-ink-3 uppercase tracking-wide">
                          {lang === "js" ? "JavaScript" : "Python"}
                        </span>
                        <button
                          className="font-mono text-xs text-ink-3 hover:text-paper transition-colors"
                          onClick={() => copyToClipboard(codeSnippets[lang], lang)}
                        >
                          {copiedKey === lang ? "Copié ✓" : "Copier"}
                        </button>
                      </div>
                      <pre className="p-4 overflow-x-auto">
                        <code className="text-sm text-ink-blue font-mono leading-relaxed">
                          {codeSnippets[lang]}
                        </code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SDK */}
          <div id="docs-sdk" className="bg-velin border border-rule rounded-xl p-7">
            <h3 className="font-heading text-xl text-ink mb-3">SDK & Bibliothèques</h3>
            <div className="text-sm text-ink-2 space-y-3">
              <p>
                L'intégration se fait via des appels HTTP (fetch/axios côté JS, requests côté Python).
                Le helper <code className="font-mono bg-paper-2 px-1.5 py-0.5 rounded">apiFetch</code> centralise la base URL et le token.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Web/React</strong> — utiliser <code className="font-mono bg-paper-2 px-1.5 py-0.5 rounded">apiFetch</code> pour centraliser les appels.</li>
                <li><strong>Hors-ligne</strong> — les écritures sont mises en attente (outbox) et rejouées automatiquement.</li>
                <li><strong>Backend-to-backend</strong> — même principe, base URL différente.</li>
              </ul>
              <p className="text-ink-3 text-xs">
                Un client TypeScript généré via OpenAPI est prévu pour une version future.
              </p>
            </div>
          </div>

          {/* Guides */}
          <div id="docs-guides" className="bg-velin border border-rule rounded-xl p-7">
            <h3 className="font-heading text-xl text-ink mb-3">Guides & Tutoriels</h3>
            <div className="text-sm text-ink-2 space-y-3">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Générer un personnage</strong> — Génération → Noms de personnages → générer → copier.</li>
                <li><strong>Travailler hors-ligne</strong> — l'app met en file les actions d'écriture. Les lectures nécessitent le backend.</li>
                <li><strong>Passer en ligne</strong> — l'outbox se resynchronise automatiquement dès que le backend est accessible.</li>
              </ul>
              <p className="text-ink-3 text-xs">
                Certaines fonctionnalités peuvent être limitées en mode hors-ligne.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}