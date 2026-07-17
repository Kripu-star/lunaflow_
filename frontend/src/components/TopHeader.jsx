import { useState } from "react";
import Logo from "./Logo";

const NAV_ITEMS = [
  { key: "home", label: "Home" },
  { key: "tracker", label: "Tracker" },
  { key: "journal", label: "Journal" },
  { key: "companion", label: "Companion" },
];

export default function TopHeader({ active, onNavigate, user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const initial = (user?.full_name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-rose-200">
      <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
        <Logo size="sm" />

        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                active === item.key
                  ? "bg-wine text-rose-50"
                  : "text-ink/60 hover:bg-rose-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            title="Notifications (coming soon)"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink/50 hover:bg-rose-50 transition"
          >
            🔔
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="w-9 h-9 rounded-full bg-wine text-rose-50 flex items-center justify-center font-display font-semibold text-sm"
            >
              {initial}
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-rose-200 overflow-hidden z-50">
                  <button
                    onClick={onLogout}
                    className="block w-full text-left px-4 py-2.5 text-sm text-ink/70 hover:bg-rose-50 transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
