import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton, useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { apiFetch } from "../lib/api";
import logoDark from "../../assets/logoSombre.jpg";

const THEME_KEY = "nomina-theme";

export function Header() {
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const initial = saved === "dark" || saved === "light"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
    if (!clerkEnabled || !isSignedIn) { setIsAdmin(false); return; }
    (async () => {
      try {
        const data = await apiFetch<{ isAdmin: boolean }>("/auth/me", { cacheTtlMs: 0 });
        if (!cancelled) setIsAdmin(Boolean(data.isAdmin));
      } catch { if (!cancelled) setIsAdmin(false); }
    })();
    return () => { cancelled = true; };
  }, [clerkEnabled, isSignedIn]);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: "/features", label: "Fonctionnalités", auth: false },
    { to: "/generate", label: "Génération", auth: true },
    { to: "/pack-ia", label: "Pack IA", auth: true },
    { to: "/pricing", label: "Tarifs", auth: false },
    { to: "/docs", label: "Documentation", auth: false },
  ];

  const adminLinks = [
    { to: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-ink border-b border-rule-2/20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-[60px]">

          {/* ── Logo ── */}
          {/* Ancien monogramme N → nouveau logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={logoDark} alt="Nomina" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-heading text-lg tracking-[0.16em] text-paper pl-[0.16em]">
              NOMINA
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map(link => {
              if (link.auth && (!clerkEnabled || !isSignedIn)) return null;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-[13px] transition-colors ${
                    isActive(link.to)
                      ? "text-paper"
                      : "text-ink-3 hover:text-paper"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {clerkEnabled && isSignedIn && isAdmin && adminLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-[13px] transition-colors ${
                  isActive(link.to) ? "text-paper" : "text-ink-3 hover:text-paper"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Desktop Actions ── */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={toggleTheme}
              className="text-ink-3 hover:text-paper transition-colors p-1.5"
              aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {clerkEnabled ? (
              <>
                <SignedOut>
                  <Link to="/login" className="text-[13px] text-ink-3 hover:text-paper transition-colors">
                    Se connecter
                  </Link>
                  <Link
                    to="/register"
                    className="bg-wax hover:bg-wax-hover text-velin rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors"
                  >
                    Commencer
                  </Link>
                </SignedOut>

                <SignedIn>
                  <span className="text-[12.5px] text-ink-3">
                    {user?.firstName || user?.primaryEmailAddress?.emailAddress || "Compte"}
                  </span>
                  {isAdmin && (
                    <span className="font-mono text-[9px] tracking-wide uppercase text-wax border border-wax/40 rounded px-1.5 py-0.5">
                      Admin
                    </span>
                  )}
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{ elements: { avatarBox: "w-[30px] h-[30px]" } }}
                  />
                  <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="text-ink-3 hover:text-paper transition-colors p-1.5"
                    aria-label="Se déconnecter"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </SignedIn>
              </>
            ) : null}
          </div>

          {/* ── Mobile Actions ── */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="text-ink-3 hover:text-paper p-1.5"
              aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {clerkEnabled && isSignedIn && (
              <button
                onClick={() => signOut({ redirectUrl: "/" })}
                className="text-ink-3 hover:text-paper p-1.5"
                aria-label="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              className="text-paper p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-rule-2/20 flex flex-col gap-3">
            {navLinks.map(link => {
              if (link.auth && (!clerkEnabled || !isSignedIn)) return null;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-[13px] ${isActive(link.to) ? "text-paper" : "text-ink-3"}`}
                >
                  {link.label}
                </Link>
              );
            })}
            {clerkEnabled && isSignedIn && isAdmin && adminLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-[13px] ${isActive(link.to) ? "text-paper" : "text-ink-3"}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              {clerkEnabled ? (
                <>
                  <SignedOut>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[13px] text-ink-3"
                    >
                      Se connecter
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-wax text-velin rounded-lg px-4 py-2.5 text-[13px] font-semibold text-center"
                    >
                      Commencer
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-[12.5px] text-ink-3">
                        {user?.firstName || "Compte"}
                      </span>
                      {isAdmin && (
                        <span className="font-mono text-[9px] uppercase text-wax border border-wax/40 rounded px-1.5 py-0.5">
                          Admin
                        </span>
                      )}
                    </div>
                  </SignedIn>
                </>
              ) : null}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}