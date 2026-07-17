const PHASE_COLORS = {
  Menstruation: "#B8493E",
  "Late Luteal": "#B8493E",
  Follicular: "#6B8F71",
  Ovulation: "#D4A24C",
  Luteal: "#8B6F8B",
  unknown: "#4A2545",
};

export default function MoonPhaseRing({ dayOfCycle, cycleLength, phase, emoji }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const safeDay = dayOfCycle || 0;
  const safeLength = cycleLength || 28;
  const progress = Math.min(safeDay / safeLength, 1);
  const offset = circumference * (1 - progress);
  const color = PHASE_COLORS[phase] || PHASE_COLORS.unknown;

  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#EDE6E3"
          strokeWidth="10"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl mb-1">{emoji || "🌙"}</span>
        {dayOfCycle ? (
          <>
            <span className="text-2xl font-display font-semibold text-ink">
              Day {dayOfCycle}
            </span>
            <span className="text-xs text-ink/60 mt-0.5">
              of ~{Math.round(safeLength)} days
            </span>
          </>
        ) : (
          <span className="text-sm text-ink/60 text-center px-4">
            Log your first period
          </span>
        )}
      </div>
    </div>
  );
}