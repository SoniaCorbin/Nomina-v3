import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getOutboxSize } from "../lib/api";

const CRUD_LINKS = [
  { to: "/cultures", label: "Cultures" },
  { to: "/categories", label: "Catégories" },
  { to: "/concepts", label: "Concepts" },
  { to: "/titres", label: "Titres" },
  { to: "/fragments-histoire", label: "Fragments" },
  { to: "/nom-personnages", label: "Noms pers." },
  { to: "/univers", label: "Univers" },
  { to: "/nom-familles", label: "Noms famille" },
  { to: "/lieux", label: "Lieux" },
  { to: "/creatures", label: "Créatures" },
  { to: "/users", label: "Utilisateurs" },
];

export function AdminPage() {
  const [health, setHealth] = useState<unknown>(null);

  useEffect(() => {
    apiFetch("/healthz").then(setHealth).catch(() => setHealth(null));
  }, []);

  return (
    <main className="min-h-screen p-6 bg-paper">
      <h1 className="font-heading text-2xl text-ink mb-5">Administration</h1>

      <div className="bg-velin border border-rule rounded-2xl p-5 mb-5">
        <h2 className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-3">Gestion du contenu</h2>
        <div className="flex flex-wrap gap-1.5">
          {CRUD_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="font-mono text-[10.5px] uppercase tracking-wide px-3 py-1.5 rounded-md border border-rule bg-white text-ink-2 hover:border-rule-2 hover:text-ink transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-velin border border-rule rounded-2xl p-5">
          <h2 className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-2">Outbox (file hors-ligne)</h2>
          <div className="font-heading text-2xl text-ink">{getOutboxSize()}</div>
          <p className="text-xs text-ink-3 mt-1">Requêtes en attente de synchronisation.</p>
        </div>

        <div className="bg-velin border border-rule rounded-2xl p-5">
          <h2 className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-2">Santé API</h2>
          <pre className="bg-ink text-ink-blue p-3 rounded-lg overflow-auto text-xs font-mono max-h-40 mt-2">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}