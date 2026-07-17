import { useState } from "react";

const ITEMS = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "tracker", label: "Tracker", icon: "📅" },
  { key: "journal", label: "Journal", icon: "📔" },
  { key: "companion", label: "Companion", icon: "💬" },
  { key: "more", label: "More", icon: "⋯" },
];

export default function BottomNav({ active, onNavigate, onLogout }) {
  const [showMore, setShowMore] = useState(false);

  function handleClick(key) {
    if (key === "more") {
      setShowMore((v) => !v);
      return;
    }
    setShowMore(false);
    onNavigate(key);
  }

  return (
    <>
      {showMore && (
        <div
          className="sm:hidden fixed inset-0 bg-ink/20 z-40"
          onClick={() => setShowMore(false)}
        >
          <div
            className="absolute bottom-16 right-4 bg-white rounded-xl shadow-lg border border-rose-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onLogout}
              className="block w-full text-left px-5 py-3 text-sm text-ink/70 hover:bg-rose-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-rose-200 flex justify-around items-center py-2">
        {ITEMS.map((item) => {
          const isActive = item.key === "more" ? showMore : active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleClick(item.key)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition ${
                isActive ? "text-wine" : "text-ink/40"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
