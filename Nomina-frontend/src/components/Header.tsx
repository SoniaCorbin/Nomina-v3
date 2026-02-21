import { Button } from "./ui/button";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton, useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

import { apiFetch } from "../lib/api";

import logoUrl from "../../assets/logo5.png";

const THEME_KEY = "nomina-theme";

export function Header() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  const { isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const initial = saved === "dark" || saved === "light"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggleTheme() {
    const next: "light" | "dark" = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  useEffect(() => {
    let cancelled = false;
    if (!clerkEnabled || !isSignedIn) {
      setIsAdmin(false);
      return;
    }

    (async () => {
      try {
        const token = await getToken();
        const data = await apiFetch<{ isAdmin: boolean }>("/auth/me", { token, cacheTtlMs: 0 });
        if (!cancelled) setIsAdmin(Boolean(data.isAdmin));
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clerkEnabled, getToken, isSignedIn]);

  return (
    <header className="sticky top-0 z-50 bg-[#2d1b4e] border-b border-[#7b3ff2]/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8b4f0]/60 rounded-lg"
            aria-label="Aller à l’accueil"
          >
            <div className="w-14 h-14 bg-[#2d1b4e] rounded-lg flex items-center justify-center"> 
              <img src={logoUrl} alt="Nomina" className="w-11 h-11 object-contain" draggable={false} />
            </div>
            <span className="text-2xl text-white" style={{ fontFamily: 'Cinzel, serif' }}>
              Nomina
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
              Fonctionnalités
            </Link>
            <Link to="/usecases" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
              Cas d'usage
            </Link>
            <Link to="/pricing" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
              Tarifs
            </Link>
            {clerkEnabled ? (
              <SignedIn>
                <Link to="/dashboard" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
                  Dashboard
                </Link>
              </SignedIn>
            ) : null}
            <Link to="/generate" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
              Génération
            </Link>
            <Link to="/docs" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
              Documentation
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-[#d4c5f9] hover:text-white hover:bg-[#7b3ff2]/20 px-2"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {clerkEnabled ? (
              <>
                <SignedOut>
                  <Button asChild variant="ghost" className="text-[#d4c5f9] hover:text-white hover:bg-[#7b3ff2]/20">
                    <Link to="/login">Connexion</Link>
                  </Button>
                  <Button asChild className="bg-[#7b3ff2] hover:bg-[#a67be8] text-white">
                    <Link to="/register">Commencer</Link>
                  </Button>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center gap-3">
                    <div className="hidden lg:flex flex-col items-end leading-tight">
                      <span className="text-xs text-[#d4c5f9] opacity-80">Connecté</span>
                      <span className="text-sm text-white">
                        {user?.firstName || user?.primaryEmailAddress?.emailAddress || "Compte"}
                        {isAdmin ? <span className="ml-2 text-xs text-[#e8b4f0]">Admin</span> : null}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="border-[#7b3ff2] text-[#d4c5f9] hover:text-white hover:bg-[#7b3ff2]/20"
                      onClick={() => signOut({ redirectUrl: "/" })}
                      aria-label="Se déconnecter"
                      title="Se déconnecter"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </Button>
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "w-9 h-9",
                        },
                      }}
                    />
                  </div>
                </SignedIn>
              </>
            ) : (
              <div className="text-sm text-[#d4c5f9] opacity-80">
                Auth désactivée (clé Clerk manquante)
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-[#d4c5f9] hover:text-white hover:bg-[#7b3ff2]/20 px-2"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {clerkEnabled ? (
              <SignedIn>
                <Button
                  variant="ghost"
                  className="text-[#d4c5f9] hover:text-white hover:bg-[#7b3ff2]/20 px-2"
                  onClick={() => signOut({ redirectUrl: "/" })}
                  aria-label="Se déconnecter"
                  title="Se déconnecter"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </SignedIn>
            ) : null}
            <button
              className="text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#7b3ff2]/20">
            <nav className="flex flex-col gap-4">
              <Link to="/features" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/usecases" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
                Cas d'usage
              </Link>
              <Link to="/pricing" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
                Tarifs
              </Link>
              {clerkEnabled ? (
                <SignedIn>
                  <Link to="/dashboard" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
                    Dashboard
                  </Link>
                </SignedIn>
              ) : null}
              <Link to="/generate" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
                Génération
              </Link>
              <Link to="/docs" className="text-[#d4c5f9] hover:text-[#e8b4f0] transition-colors">
                Documentation
              </Link>
              <div className="flex flex-col gap-2 pt-2">
                {clerkEnabled ? (
                  <>
                    <SignedOut>
                      <Button asChild variant="outline" className="border-[#7b3ff2] text-[#d4c5f9]">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          Connexion
                        </Link>
                      </Button>
                      <Button asChild className="bg-[#7b3ff2] hover:bg-[#a67be8] text-white">
                        <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                          Commencer
                        </Link>
                      </Button>
                    </SignedOut>
                    <SignedIn>
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="text-center">
                          <div className="text-xs text-[#d4c5f9] opacity-80">Connecté</div>
                          <div className="text-sm text-white">
                            {user?.firstName || user?.primaryEmailAddress?.emailAddress || "Compte"}
                            {isAdmin ? <span className="ml-2 text-xs text-[#e8b4f0]">Admin</span> : null}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="border-[#7b3ff2] text-[#d4c5f9]"
                          onClick={() => signOut({ redirectUrl: "/" })}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Se déconnecter
                        </Button>
                        <UserButton
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              avatarBox: "w-9 h-9",
                            },
                          }}
                        />
                      </div>
                    </SignedIn>
                  </>
                ) : (
                  <div className="text-sm text-[#d4c5f9] opacity-80">
                    Auth désactivée (clé Clerk manquante)
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {null}
    </header>
  );
}
