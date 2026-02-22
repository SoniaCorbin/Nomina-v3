import { Link, useLocation } from "react-router-dom";

type NavItem = {
  to: string;
  label: string;
};

const navItems: NavItem[] = [
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
  const location = useLocation();

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              isActive
                ? "border-[#7b3ff2] bg-[#7b3ff2] text-white"
                : "border-[#d4c5f9] bg-white text-[#2d1b4e] hover:bg-[#f8f6fc]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
