import { useEffect, useState } from "react";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { apiFetch, ApiError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Link } from "react-router-dom";
import { 
  Users, 
  Globe, 
  Tag, 
  Lightbulb, 
  Award, 
  BookOpen, 
  User, 
  MapPin,
  Sparkles,
  TrendingUp,
  Activity
} from "lucide-react";

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

export function DashboardPage() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <main className="min-h-screen p-6 bg-gradient-to-b from-violet-50 via-white to-pink-50 dark:from-[#120b22] dark:via-[#0f0a1b] dark:to-[#140b24]">
        <div className="mx-auto w-full max-w-5xl">
          <Card className="bg-white border-[#d4c5f9] p-6 dark:bg-[#1a1230] dark:border-[#3e2a66]">
            <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
            <p className="opacity-80">Auth désactivée (clé Clerk manquante).</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <main className="min-h-screen p-6 bg-gradient-to-b from-violet-50 via-white to-pink-50 dark:from-[#120b22] dark:via-[#0f0a1b] dark:to-[#140b24]">
          <div className="mx-auto w-full max-w-5xl">
            <Card className="bg-white border-[#d4c5f9] p-6 dark:bg-[#1a1230] dark:border-[#3e2a66]">
              <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
              <p className="opacity-80 mb-4">Connexion requise pour accéder au dashboard.</p>
              <Button asChild className="bg-[#7b3ff2] hover:bg-[#a67be8] text-white">
                <Link to="/login">Connexion</Link>
              </Button>
            </Card>
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
  const { getToken } = useAuth();
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
        const token = await getToken();
        const data = await apiFetch<Me>("/auth/me", { token });
        if (!cancelled) setMe(data);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof ApiError ? `${e.message} (HTTP ${e.status})` : String(e);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const token = await getToken();
        const [cultures, categories, concepts, titres, fragments, nomPersonnages, lieux, creatures, users] = await Promise.all([
          apiFetch<{ total: number }>("/cultures/total", { token }).catch(() => ({ total: 0 })),
          apiFetch<{ total: number }>("/categories/total", { token }).catch(() => ({ total: 0 })),
          apiFetch<{ total: number }>("/concepts/total", { token }).catch(() => ({ total: 0 })),
          apiFetch<{ total: number }>("/titres/total", { token }).catch(() => ({ total: 0 })),
          apiFetch<{ total: number }>("/fragmentsHistoire/total", { token }).catch(() => ({ total: 0 })),
          apiFetch<{ total: number }>("/nomPersonnages/total", { token }).catch(() => ({ total: 0 })),
          apiFetch<{ total: number }>("/lieux/total", { token }).catch(() => ({ total: 0 })),
          apiFetch<{ total: number }>("/creatures/total", { token }).catch(() => ({ total: 0 })),
          me?.isAdmin 
            ? apiFetch<{ total: number }>("/users/total", { token }).catch(() => ({ total: 0 }))
            : Promise.resolve({ total: 0 }),
        ]);

        if (!cancelled) {
          setStats({
            cultures: cultures.total,
            categories: categories.total,
            concepts: concepts.total,
            titres: titres.total,
            fragments: fragments.total,
            nomPersonnages: nomPersonnages.total,
            lieux: lieux.total,
            creatures: creatures.total,
            users: users.total,
          });
        }
      } catch (e) {
        if (!cancelled) console.error("Erreur chargement stats:", e);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, me?.isAdmin]);

  return (
    <main className="min-h-screen p-6 bg-gradient-to-b from-violet-50 via-white to-pink-50 dark:from-[#120b22] dark:via-[#0f0a1b] dark:to-[#140b24]">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <Card className="bg-white border-[#d4c5f9] p-6 dark:bg-[#1a1230] dark:border-[#3e2a66]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold flex items-center gap-3">
                <Activity className="w-8 h-8 text-[#7b3ff2]" />
                Dashboard
              </h1>
              <p className="opacity-80 mt-1">Bienvenue sur la plateforme de génération créative</p>
            </div>
            {me ? (
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  me.isAdmin 
                    ? "bg-[#7b3ff2] text-white" 
                    : "border border-[#d4c5f9] text-[#2d1b4e] dark:border-[#4f3a7a] dark:text-[#efe7ff]"
                }`}>
                  {me.isAdmin ? "🛡️ Admin" : "👤 Utilisateur"}
                </span>
              </div>
            ) : null}
          </div>

          {loading ? <p className="mt-4 text-[#7b3ff2]">Chargement…</p> : null}
          {error ? <p className="mt-4 text-red-600">{error}</p> : null}
        </Card>

        {/* Stats Grid */}
        {statsLoading ? (
          <Card className="bg-white border-[#d4c5f9] p-6 dark:bg-[#1a1230] dark:border-[#3e2a66]">
            <p className="text-center text-[#7b3ff2]">Chargement des statistiques…</p>
          </Card>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Globe className="w-5 h-5" />}
                label="Cultures"
                value={stats.cultures}
                color="bg-blue-500"
                link="/cultures"
                isAdmin={me?.isAdmin}
              />
              <StatCard
                icon={<Tag className="w-5 h-5" />}
                label="Catégories"
                value={stats.categories}
                color="bg-purple-500"
                link="/categories"
                isAdmin={me?.isAdmin}
              />
              <StatCard
                icon={<Lightbulb className="w-5 h-5" />}
                label="Concepts"
                value={stats.concepts}
                color="bg-yellow-500"
                link="/concepts"
                isAdmin={me?.isAdmin}
              />
              <StatCard
                icon={<Award className="w-5 h-5" />}
                label="Titres"
                value={stats.titres}
                color="bg-pink-500"
                link="/titres"
                isAdmin={me?.isAdmin}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<BookOpen className="w-5 h-5" />}
                label="Fragments"
                value={stats.fragments}
                color="bg-indigo-500"
                link="/fragments-histoire"
                isAdmin={me?.isAdmin}
              />
              <StatCard
                icon={<User className="w-5 h-5" />}
                label="Personnages"
                value={stats.nomPersonnages}
                color="bg-green-500"
                link="/nom-personnages"
                isAdmin={me?.isAdmin}
              />
              <StatCard
                icon={<MapPin className="w-5 h-5" />}
                label="Lieux"
                value={stats.lieux}
                color="bg-red-500"
                link="/lieux"
                isAdmin={me?.isAdmin}
              />
              <StatCard
                icon={<Sparkles className="w-5 h-5" />}
                label="Créatures"
                value={stats.creatures}
                color="bg-violet-500"
                link="/creatures"
                isAdmin={me?.isAdmin}
              />
              {me?.isAdmin ? (
                <StatCard
                  icon={<Users className="w-5 h-5" />}
                  label="Utilisateurs"
                  value={stats.users}
                  color="bg-gray-500"
                  link="/users"
                  isAdmin={true}
                />
              ) : (
                <Card className="bg-gradient-to-br from-[#7b3ff2] to-[#a67be8] text-white p-6 border-0 dark:from-[#5d2ab8] dark:to-[#7f53d1]">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {stats.cultures + stats.concepts + stats.titres}
                      </div>
                      <div className="text-sm opacity-90">Ressources totales</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </>
        ) : null}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white p-6 border-[#d4c5f9] dark:bg-[#1a1230] dark:border-[#3e2a66]">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#7b3ff2]" />
              Actions rapides
            </h2>
            <div className="flex flex-col gap-2">
              <Button
                asChild
                className="justify-start bg-gradient-to-r from-[#7b3ff2] to-[#a67be8] hover:from-[#6b2fe2] hover:to-[#9657d8] text-white"
              >
                <Link to="/generate">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer du contenu
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-start border-[#d4c5f9] bg-[#7b3ff2]/10 hover:bg-[#7b3ff2]/20 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#7b3ff2]/20 dark:hover:bg-[#7b3ff2]/30 dark:text-[#efe7ff]"
              >
                <Link to="/docs">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Documentation API
                </Link>
              </Button>
              {me?.isAdmin ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/cultures">
                      <Globe className="w-4 h-4 mr-2" />
                      Gérer les cultures
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/categories">
                      <Tag className="w-4 h-4 mr-2" />
                      Gérer les catégories
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/concepts">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Gérer les concepts
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/titres">
                      <Award className="w-4 h-4 mr-2" />
                      Gérer les titres
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/fragments-histoire">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Gérer les fragments d’histoire
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/nom-personnages">
                      <User className="w-4 h-4 mr-2" />
                      Gérer les noms de personnages
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/univers">
                      <Globe className="w-4 h-4 mr-2" />
                      Gérer les univers thématiques
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/nom-familles">
                      <Users className="w-4 h-4 mr-2" />
                      Gérer les noms de famille
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/lieux">
                      <MapPin className="w-4 h-4 mr-2" />
                      Gérer les lieux
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/creatures">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gérer les créatures
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="justify-start border-[#d4c5f9] bg-white hover:bg-[#7b3ff2]/10 text-[#2d1b4e] dark:border-[#4f3a7a] dark:bg-[#1e1537] dark:hover:bg-[#7b3ff2]/25 dark:text-[#efe7ff]"
                  >
                    <Link to="/users">
                      <Users className="w-4 h-4 mr-2" />
                      Gérer les utilisateurs
                    </Link>
                  </Button>
                </>
              ) : null}
            </div>
          </Card>

          <Card className="bg-white p-6 border-[#d4c5f9] dark:bg-[#1a1230] dark:border-[#3e2a66]">
            <h2 className="text-lg font-semibold mb-3">Session</h2>
            {me ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="opacity-70 block mb-1">Identifiant</span>
                  <div className="font-mono text-xs bg-[#7b3ff2]/5 p-2 rounded border border-[#d4c5f9] break-all dark:bg-[#241842] dark:border-[#4f3a7a]">
                    {me.userId}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="opacity-70 block mb-1">Niveau d'accès</span>
                  <div className="mt-1 flex items-center gap-2">
                    {me.isAdmin ? (
                      <>
                        <span className="bg-[#7b3ff2] text-white px-3 py-1 rounded-full text-xs font-medium">
                          Administrateur
                        </span>
                        <span className="text-xs opacity-70">Accès complet</span>
                      </>
                    ) : (
                      <>
                        <span className="border border-[#d4c5f9] text-[#2d1b4e] px-3 py-1 rounded-full text-xs font-medium dark:border-[#4f3a7a] dark:text-[#efe7ff]">
                          Utilisateur
                        </span>
                        <span className="text-xs opacity-70">Accès standard</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="opacity-70">Aucune information.</p>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color, 
  link, 
  isAdmin 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string; 
  link: string;
  isAdmin?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div className={`${color} text-white p-3 rounded-lg`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-[#2d1b4e] dark:text-[#efe7ff]">{value.toLocaleString()}</div>
        <div className="text-sm text-[#2d1b4e]/70 dark:text-[#d6c6ff]">{label}</div>
      </div>
    </div>
  );

  if (isAdmin) {
    return (
      <Link to={link}>
        <Card className="bg-white border-[#d4c5f9] p-6 hover:border-[#7b3ff2] hover:shadow-md transition-all cursor-pointer dark:bg-[#1a1230] dark:border-[#3e2a66] dark:hover:border-[#8f67dd]">
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="bg-white border-[#d4c5f9] p-6 dark:bg-[#1a1230] dark:border-[#3e2a66]">
      {content}
    </Card>
  );
}
