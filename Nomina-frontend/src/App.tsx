import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { lazy, Suspense, useEffect, useState } from "react";
import { flushOutbox } from "./lib/api";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FluidBackground } from "./components/FluidBackground";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { setApiTokenProvider, apiFetch, ApiError } from "./lib/api";

const Features = lazy(() => import("./components/Features").then((m) => ({ default: m.Features })));
const UseCases = lazy(() => import("./components/UseCases").then((m) => ({ default: m.UseCases })));
const ApiDemo = lazy(() => import("./components/ApiDemo").then((m) => ({ default: m.ApiDemo })));
const Pricing = lazy(() => import("./components/Pricing").then((m) => ({ default: m.Pricing })));
const Documentation = lazy(() => import("./components/Documentation").then((m) => ({ default: m.Documentation })));

const GeneratePage = lazy(() => import("./pages/GeneratePage").then((m) => ({ default: m.GeneratePage })));
const PackIAPage = lazy(() => import("./pages/PackIAPage").then((m) => ({ default: m.PackIAPage })));
const UsersPage = lazy(() => import("./pages/UsersPage").then((m) => ({ default: m.UsersPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const SsoCallbackPage = lazy(() => import("./pages/SsoCallbackPage").then((m) => ({ default: m.SsoCallbackPage })));
const CulturesPage = lazy(() => import("./pages/CulturesPage").then((m) => ({ default: m.CulturesPage })));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage").then((m) => ({ default: m.CategoriesPage })));
const ConceptsPage = lazy(() => import("./pages/ConceptsPage").then((m) => ({ default: m.ConceptsPage })));
const TitresPage = lazy(() => import("./pages/TitresPage").then((m) => ({ default: m.TitresPage })));
const FragmentsHistoirePage = lazy(() => import("./pages/FragmentsHistoirePage").then((m) => ({ default: m.FragmentsHistoirePage })));
const NomPersonnagesPage = lazy(() => import("./pages/NomPersonnagesPage").then((m) => ({ default: m.NomPersonnagesPage })));
const UniversPage = lazy(() => import("./pages/UniversPage").then((m) => ({ default: m.UniversPage })));
const LieuxPage = lazy(() => import("./pages/LieuxPage").then((m) => ({ default: m.LieuxPage })));
const NomFamillesPage = lazy(() => import("./pages/NomFamillesPage").then((m) => ({ default: m.NomFamillesPage })));
const CreaturesPage = lazy(() => import("./pages/CreaturesPage").then((m) => ({ default: m.CreaturesPage })));
const DesktopTokenPage = lazy(() => import("./pages/DesktopTokenPage").then((m) => ({ default: m.DesktopTokenPage })));

function PageLoader() {
  return <main className="min-h-screen p-6">Chargement…</main>;
}

function ClerkTokenBridge() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  if (!clerkEnabled) return null;
  return <ClerkTokenBridgeInner />;
}

function ClerkTokenBridgeInner() {
  const { getToken } = useAuth();

  useEffect(() => {
    setApiTokenProvider(() => getToken());
    return () => setApiTokenProvider(null);
  }, [getToken]);

  return null;
}

function RequireSignedIn(props: { children: JSX.Element }) {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-2xl font-semibold mb-2">Accès restreint</h1>
        <p className="opacity-80">L’authentification est désactivée (clé Clerk manquante).</p>
      </main>
    );
  }

  return (
    <>
      <SignedIn>{props.children}</SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
}

function RequireAdmin(props: { children: JSX.Element }) {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-2xl font-semibold mb-2">Admin</h1>
        <p className="opacity-80">Auth désactivée (clé Clerk manquante).</p>
      </main>
    );
  }

  return <RequireAdminInner>{props.children}</RequireAdminInner>;
}

function RequireAdminInner(props: { children: JSX.Element }) {
  const { isSignedIn, getToken } = useAuth();
  const [state, setState] = useState<
    { status: "loading" } | { status: "ok" } | { status: "forbidden" } | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;
    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      try {
        return await Promise.race<T>([
          promise,
          new Promise<T>((_, reject) => {
            timer = setTimeout(() => reject(new Error("Délai dépassé pendant la vérification admin")), timeoutMs);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    (async () => {
      try {
        let data: { userId: string; isAdmin: boolean } | null = null;
        let lastError: unknown = null;

        for (let i = 0; i < 4; i++) {
          try {
            const token = await getToken().catch(() => null);

            if (!token) {
              await new Promise((r) => setTimeout(r, 250));
              continue;
            }

            data = await withTimeout(
              apiFetch<{ userId: string; isAdmin: boolean }>("/auth/me", {
                cacheTtlMs: 0,
                token,
              }),
              6000
            );
            break;
          } catch (e) {
            lastError = e;

            if (e instanceof ApiError && e.status === 403) {
              break;
            }

            if (e instanceof ApiError && e.status === 401 && i >= 3) {
              break;
            }

            await new Promise((r) => setTimeout(r, 250));
          }
        }

        if (!data) {
          throw lastError ?? new Error("Impossible de vérifier les droits admin");
        }

        if (cancelled) return;
        setState(data.isAdmin ? { status: "ok" } : { status: "forbidden" });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          const backendMessage = e.payload?.error?.trim();
          setState({
            status: "error",
            message: backendMessage && backendMessage.length > 0
              ? backendMessage
              : "Session expirée ou invalide. Reconnecte-toi.",
          });
          return;
        }

        setState({ status: "error", message: String((e as any)?.message ?? e) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  return (
    <>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>

      <SignedIn>
        {state.status === "loading" ? (
          <main className="min-h-screen p-6">Vérification des droits…</main>
        ) : state.status === "ok" ? (
          props.children
        ) : state.status === "forbidden" ? (
          <Navigate to="/" replace />
        ) : (
          <main className="min-h-screen p-6">
            <h1 className="text-2xl font-semibold mb-2">Erreur</h1>
            <p className="text-red-600">{state.message}</p>
          </main>
        )}
      </SignedIn>
    </>
  );
}

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "";

  useEffect(() => {
    // Tente une synchro au démarrage (si des requêtes offline existent).
    flushOutbox().catch(() => undefined);

    const onOnline = () => {
      flushOutbox().catch(() => undefined);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FluidBackground />
      <Header />
      <ClerkTokenBridge />
      {!isHome ? (
        <div className="pointer-events-none fixed top-20 inset-x-0 z-40 h-7 bg-gradient-to-b from-[#2d1b4e]/70 via-[#2d1b4e]/20 to-transparent" />
      ) : null}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/homepage" element={<Navigate to="/" replace />} />
            <Route path="/features" element={<Features />} />
            <Route path="/usecases" element={<UseCases />} />
            <Route path="/demo" element={<ApiDemo />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/pack-ia" element={<PackIAPage />} />
            <Route path="/dashboard" element={<RequireSignedIn><DashboardPage /></RequireSignedIn>} />
            <Route path="/cultures" element={<RequireAdmin><CulturesPage /></RequireAdmin>} />
            <Route path="/categories" element={<RequireAdmin><CategoriesPage /></RequireAdmin>} />
            <Route path="/concepts" element={<RequireAdmin><ConceptsPage /></RequireAdmin>} />
            <Route path="/titres" element={<RequireAdmin><TitresPage /></RequireAdmin>} />
            <Route path="/fragments-histoire" element={<RequireAdmin><FragmentsHistoirePage /></RequireAdmin>} />
            <Route path="/nom-personnages" element={<RequireAdmin><NomPersonnagesPage /></RequireAdmin>} />
            <Route path="/univers" element={<RequireAdmin><UniversPage /></RequireAdmin>} />
            <Route path="/lieux" element={<RequireAdmin><LieuxPage /></RequireAdmin>} />
            <Route path="/nom-familles" element={<RequireAdmin><NomFamillesPage /></RequireAdmin>} />
            <Route path="/creatures" element={<RequireAdmin><CreaturesPage /></RequireAdmin>} />
            <Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
            <Route path="/desktop-token" element={<RequireSignedIn><DesktopTokenPage /></RequireSignedIn>} />
            <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/sso-callback" element={<SsoCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
