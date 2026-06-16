import { Link, useLocation } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/cultures", label: "Cultures" },
  { to: "/categories", label: "Catégories" },
  { to: "/concepts", label: "Concepts" },
  { to: "/titres", label: "Titres" },
  { to: "/fragments-histoire", label: "Fragments" },
  { to: "/nom-personnages", label: "Noms pers." },
  { to: "/nom-familles", label: "Noms famille" },
  { to: "/lieux", label: "Lieux" },
  { to: "/creatures", label: "Créatures" },
  { to: "/univers", label: "Univers" },
];

export function ModelTypeNav() {
  const { pathname } = useLocation();
  return (
    <nav className="mb-5 flex flex-wrap gap-1.5">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`font-mono text-[10.5px] uppercase tracking-wide px-3 py-1.5 rounded-md border transition-colors ${
            pathname === item.to
              ? "bg-ink text-paper border-ink"
              : "bg-velin text-ink-2 border-rule hover:border-rule-2"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}