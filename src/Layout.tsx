import { NavLink, Outlet } from "react-router-dom";
import { Music, LayoutGrid } from "lucide-react";

export default function Layout() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-800 text-white">
              <Music size={18} />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-bold tracking-tight sm:text-lg">
                관현악부 연명부
              </h1>
              <p className="hidden text-xs text-stone-500 sm:block">
                Roster &amp; Seating
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            <NavItem to="/roster" icon={<Music size={16} />} label="연명부" />
            <NavItem
              to="/seating"
              icon={<LayoutGrid size={16} />}
              label="자리배치"
            />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-stone-800 text-white"
            : "text-stone-600 hover:bg-stone-100"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
