import { Github, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import logoDark from "../../assets/logoSombre.jpg";

export function Footer() {
  return (
    <footer className="bg-ink border-t border-rule/20 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* ── Marque ── */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <img src={logoDark} alt="Nomina" className="w-9 h-9 rounded-full object-cover" />
              <span className="font-heading text-lg tracking-[0.16em] text-paper pl-[0.16em]">
                NOMINA
              </span>
            </Link>
            <p className="text-sm text-ink-3 leading-relaxed">
              Créez, nommez, racontez — l'API de génération narrative.
            </p>
          </div>

          {/* ── Produit ── */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 mb-4">
              Produit
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/features" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/generate" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Génération
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Ressources ── */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 mb-4">
              Ressources
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/docs" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Guide de démarrage
                </Link>
              </li>
              <li>
                <Link to="/pack-ia" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Pack IA
                </Link>
              </li>
              <li>
                <a href="https://github.com/SoniaCorbin/Nomina-v3" target="_blank" rel="noopener noreferrer" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* ── Entreprise ── */}
          <div>
            <h4 className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-3 mb-4">
              Légal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#/privacy" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Confidentialité
                </a>
              </li>
              <li>
                <a href="#/terms" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Conditions d'utilisation
                </a>
              </li>
              <li>
                <a href="mailto:contact@nomina.app" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Barre du bas ── */}
        <div className="pt-8 border-t border-rule/15 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[11px] tracking-wide text-ink-3">
            © 2026 Nomina · Corbin Creative Tech Inc.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/SoniaCorbin/Nomina-v3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-3 hover:text-paper transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-3 hover:text-paper transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}