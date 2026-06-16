import { useEffect, useState } from "react";
import { SignedIn, SignedOut, useClerk } from "@clerk/clerk-react";
import { apiFetch, ApiError } from "../lib/api";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

type Me = { userId: string; isAdmin: boolean };
type Stats = {
  cultures: number;
  categories: number;
  concepts: number;
  titres: number;
  fragments: number;
  nomPersonnages: number;
  lieux: number;
  creatures: number;
  users: number;
};

const ADMIN_LINKS = [
  { to: "/cultures", label: "Cultures", letter: "C" },
  { to: "/univers", label: "Univers", letter: "U" },
  { to: "/categories", label: "Catégories", letter: "K" },
  { to: "/concepts", label: "Concepts", letter: "O" },
  { to: "/titres", label: "Titres", letter: "T" },
  { to: "/fragments-histoire", label: "Fragments", letter: "F" },
  { to: "/nom-personnages", label: "Noms", letter: "N" },
  { to: "/nom-familles", label: "Familles", letter: "Fa" },
  { to: "/lieux", label: "Lieux", letter: "L" },
  { to: "/creatures", label: "Créatures", letter: "Cr" },
  { to: "/users", label: "Utilisateurs", letter: "Us" },
];

export function DashboardPage() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <main className="min-h-screen p-6 bg-paper">
        <div className="mx-auto max-w-5xl">
          <div className="bg-velin border border-rule rounded-xl p-6">
            <h1 className="font-heading text-2xl text-ink">Dashboard</h1>
            <p className="text-ink-3 mt-1">Auth désactivée (clé Clerk manquante).</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <main className="min-h-screen p-6 bg-paper">
          <div className="mx-auto max-w-5xl">
            <div className="bg-velin border border-rule rounded-xl p-6">
              <h1 className="font-heading text-2xl text-ink mb-2">Dashboard</h1>
              <p className="text-ink-3 mb-4">Connexion requise pour accéder au dashboard.</p>
              <Link
                to="/login"
                className="inline-block bg-wax hover:bg-wax-hover text-velin rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                Connexion
              </Link>
            </div>
          </div>
        </main>
      </SignedOut>
      <SignedIn>
        <DashboardInner />
      </SignedIn>
    </>
  );
}

function DashboardInner() {
  const { openUserProfile } = useClerk();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Me>("/auth/me", { cacheTtlMs: 0 });
        if (!cancelled) setMe(data);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          setMe({ userId: "session-unavailable", isAdmin: false });
          return;
        }
        setError(e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const [cultures, categories, concepts, titres, fragments, nomPersonnages, lieux, creatures, users] =
          await Promise.all([
            apiFetch<{ total: number }>("/cultures/total").catch(() => ({ total: 0 })),
            apiFetch<{ total: number }>("/categories/total").catch(() => ({ total: 0 })),
            apiFetch<{ total: number }>("/concepts/total").catch(() => ({ total: 0 })),
            apiFetch<{ total: number }>("/titres/total").catch(() => ({ total: 0 })),
            apiFetch<{ total: number }>("/fragmentsHistoire/total").catch(() => ({ total: 0 })),
            apiFetch<{ total: number }>("/nomPersonnages/total").catch(() => ({ total: 0 })),
            apiFetch<{ total: number }>("/lieux/total").catch(() => ({ total: 0 })),
            apiFetch<{ total: number }>("/creatures/total").catch(() => ({ total: 0 })),
            me?.isAdmin
              ? apiFetch<{ total: number }>("/users/total").catch(() => ({ total: 0 }))
              : Promise.resolve({ total: 0 }),
          ]);
        if (!cancelled)
          setStats({
            cultures: cultures.total, categories: categories.total,
            concepts: concepts.total, titres: titres.total,
            fragments: fragments.total, nomPersonnages: nomPersonnages.total,
            lieux: lieux.total, creatures: creatures.total, users: users.total,
          });
      } catch {
        /* silenced */
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [me?.isAdmin]);

  const total = stats
    ? stats.cultures + stats.categories + stats.concepts + stats.titres +
      stats.fragments + stats.nomPersonnages + stats.lieux + stats.creatures
    : 0;

  return (
    <main className="min-h-screen p-6 bg-paper">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* ── En-tête ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl text-ink">Tableau de bord</h1>
            <p className="text-ink-3 text-sm mt-1">
              Bonjour — voici l'état de ton univers.
            </p>
          </div>
          {me && (
            <span className={`font-mono text-[10px] tracking-wide uppercase rounded-md px-3 py-1.5 ${
              me.isAdmin
                ? "bg-ink text-paper"
                : "border border-rule text-ink-3"
            }`}>
              {me.isAdmin ? "Administrateur · accès complet" : "Utilisateur"}
            </span>
          )}
        </div>

        {loading && <p className="text-wax text-sm">Chargement…</p>}
        {error && <p className="text-crit text-sm">{error}</p>}

        {/* ── Stats principales ── */}
        {statsLoading ? (
          <div className="bg-velin border border-rule rounded-xl p-6">
            <p className="text-center text-ink-3 text-sm">Chargement des statistiques…</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Cultures" value={stats.cultures} />
            <StatTile label="Concepts" value={stats.concepts} />
            <StatTile label="Personnages" value={stats.nomPersonnages} />
            <div className="bg-ink border border-ink rounded-2xl px-5 py-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3">
                  Ressources
                </span>
                <span className="w-5 h-5 rounded-full bg-wax" />
              </div>
              <div className="font-heading text-[34px] leading-none text-paper mt-2.5">
                {total.toLocaleString()}
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
          {/* ── Gérer le contenu (admin) ── */}
          <div>
            {me?.isAdmin && stats ? (
              <>
                <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-3">
                  Gérer le contenu
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ADMIN_LINKS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="bg-velin border border-rule rounded-xl px-3.5 py-3 flex items-center gap-2.5 hover:border-rule-2 transition-colors"
                    >
                      <span className="w-7 h-7 rounded-lg bg-paper-2 text-ink-3 flex items-center justify-center font-heading text-sm">
                        {item.letter}
                      </span>
                      <div>
                        <div className="text-[13.5px] text-ink">{item.label}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : stats ? (
              <>
                <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-3">
                  Statistiques détaillées
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <StatTile label="Titres" value={stats.titres} />
                  <StatTile label="Fragments" value={stats.fragments} />
                  <StatTile label="Lieux" value={stats.lieux} />
                  <StatTile label="Créatures" value={stats.creatures} />
                </div>
              </>
            ) : null}
          </div>

          {/* ── Panneau droit ── */}
          <div className="space-y-3">
            {/* Action principale */}
            <Link
              to="/generate"
              className="block bg-wax hover:bg-wax-hover rounded-2xl px-5 py-4 transition-colors"
            >
              <div className="flex items-center gap-2 text-velin">
                <Sparkles className="w-4 h-4" />
                <span className="font-heading text-lg">Générer du contenu</span>
              </div>
              <p className="text-velin/80 text-[12.5px] mt-1">
                Personnages, lieux, créatures…
              </p>
            </Link>

            {/* Session */}
            <div className="bg-velin border border-rule rounded-2xl px-5 py-4">
              <div className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3 mb-2">
                Session
              </div>
              {me ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-[13.5px] text-ink">
                      {me.isAdmin ? "Administrateur" : "Utilisateur"}
                    </div>
                    <div className="text-[12px] text-ink-3 mt-0.5">
                      {me.isAdmin ? "Accès complet" : "Accès standard"} · profil modifiable
                    </div>
                  </div>
                  <button
                    onClick={() => openUserProfile()}
                    className="text-sm text-ink-blue hover:underline"
                  >
                    Modifier mon profil
                  </button>
                </div>
              ) : (
                <p className="text-ink-3 text-sm">Aucune information.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-velin border border-rule rounded-2xl px-5 py-4">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[9.5px] tracking-wide uppercase text-ink-3">
          {label}
        </span>
        <span className="w-5 h-5 rounded-full bg-paper-2" />
      </div>
      <div className="font-heading text-[34px] leading-none text-ink mt-2.5">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
