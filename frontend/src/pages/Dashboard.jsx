import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMe,
  getCycles,
  createCycle,
  getPrediction,
  getMoods,
  createMood,
  getMoodStats,
  getCyclePhase,
  deleteCycle,
  deleteMood,
} from "../api";
import MoonPhaseRing from "../components/MoonPhaseRing";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";
import { IconPlus, IconChevronDown, IconTrash, IconDroplet } from "../components/icons";

const MOOD_EMOJIS = ["😢", "😟", "😐", "😊", "😁"];
const ENERGY_EMOJIS = ["🪫", "😴", "⚡", "🔥", "💥"];

const PHASE_TEXT_COLOR = {
  Menstruation: "text-[#B8493E]",
  "Late Luteal": "text-[#B8493E]",
  Follicular: "text-[#6B8F71]",
  Ovulation: "text-[#D4A24C]",
  Luteal: "text-[#8B6F8B]",
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [moods, setMoods] = useState([]);
  const [moodStats, setMoodStats] = useState(null);
  const [cyclePhase, setCyclePhase] = useState(null);
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [cycleNotes, setCycleNotes] = useState("");
  const [periodLength, setPeriodLength] = useState("");
  const [moodScore, setMoodScore] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [moodNote, setMoodNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [userRes, cyclesRes, predRes, moodsRes, statsRes, phaseRes] =
        await Promise.all([
          getMe(),
          getCycles(),
          getPrediction(),
          getMoods(),
          getMoodStats(),
          getCyclePhase(),
        ]);

      if (!userRes || !userRes.ok) {
        navigate("/login");
        return;
      }

      setUser(await userRes.json());
      setCycles(await cyclesRes.json());
      setPrediction(await predRes.json());
      setMoods(await moodsRes.json());
      setMoodStats(await statsRes.json());
      if (phaseRes && phaseRes.ok) setCyclePhase(await phaseRes.json());
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogCycle(e) {
    e.preventDefault();
    const res = await createCycle(
      new Date(startDate).toISOString(),
      cycleNotes,
      periodLength || null
    );
    if (res && res.ok) {
      setShowCycleForm(false);
      setStartDate("");
      setCycleNotes("");
      setPeriodLength("");
      loadData();
    } else if (res) {
      const data = await res.json();
      alert(data.detail || "Could not log cycle");
    }
  }

  async function handleLogMood(e) {
    e.preventDefault();
    const res = await createMood(moodScore, energyLevel, moodNote);
    if (res && res.ok) {
      setShowMoodForm(false);
      setMoodScore(3);
      setEnergyLevel(3);
      setMoodNote("");
      loadData();
    }
  }

  async function handleDeleteCycle(cycleId) {
    if (!window.confirm("Delete this period entry?")) return;
    const res = await deleteCycle(cycleId);
    if (res && (res.ok || res.status === 204)) {
      loadData();
    } else if (res) {
      const data = await res.json().catch(() => ({}));
      alert(data.detail || "Could not delete this period entry.");
    }
  }

  async function handleDeleteMood(moodId) {
    if (!window.confirm("Delete this mood entry?")) return;
    const res = await deleteMood(moodId);
    if (res && (res.ok || res.status === 204)) {
      loadData();
    } else if (res) {
      const data = await res.json().catch(() => ({}));
      alert(data.detail || "Could not delete this mood entry.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  function handleNavigate(key) {
    if (key === "companion") {
      navigate("/chat");
      return;
    }
    setView(key);
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function daysUntil(dateStr) {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl mb-2">🌙</p>
          <p className="font-display text-ink/70">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const phaseColor = PHASE_TEXT_COLOR[cyclePhase?.phase] || "text-wine";

  return (
    <div className="min-h-screen bg-rose-50 pb-20 sm:pb-0">
      <TopHeader
        active={view}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {view === "home" && (
          <>
            <p className="font-display text-lg text-ink">
              Hi, {user?.full_name || user?.email}
            </p>

            {/* Hero: Moon Phase Ring */}
            <div className="hero-glow rounded-2xl border border-rose-200 shadow-[0_2px_24px_rgba(122,46,69,0.08)] p-8 text-center">
              <MoonPhaseRing
                dayOfCycle={cyclePhase?.day_of_cycle}
                cycleLength={prediction?.average_cycle_length_days}
                phase={cyclePhase?.phase}
                emoji={cyclePhase?.emoji}
              />
              {cyclePhase && cyclePhase.phase !== "unknown" && (
                <div className="mt-5 max-w-md mx-auto">
                  <p className={`font-display text-lg font-semibold ${phaseColor}`}>
                    {cyclePhase.phase}
                  </p>
                  <p className="text-sm text-ink/60 mt-1">{cyclePhase.description}</p>
                  {cyclePhase.tips?.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {cyclePhase.tips.slice(0, 3).map((tip, i) => (
                        <span
                          key={i}
                          className="text-xs bg-rose-50 border border-rose-200 text-ink/70 px-2.5 py-1 rounded-full"
                        >
                          {tip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5">
                <h2 className="text-xs font-semibold text-wine uppercase tracking-wide mb-2">
                  Next Period
                </h2>
                {prediction?.predicted_next_start ? (
                  <>
                    <p className="font-display text-xl font-semibold text-ink">
                      {formatDate(prediction.predicted_next_start)}
                    </p>
                    <p className="text-sm text-ink/60 mt-1">
                      {daysUntil(prediction.predicted_next_start)} days away · avg{" "}
                      {prediction.average_cycle_length_days}d cycle
                    </p>
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        prediction.confidence === "high"
                          ? "bg-[#6B8F71]/15 text-[#6B8F71]"
                          : prediction.confidence === "medium"
                          ? "bg-[#D4A24C]/15 text-[#D4A24C]"
                          : "bg-ink/10 text-ink/50"
                      }`}
                    >
                      {prediction.confidence} confidence
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-ink/50">
                    Log at least 2 periods to see a prediction here.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5">
                <h2 className="text-xs font-semibold text-wine uppercase tracking-wide mb-2">
                  Mood Overview
                </h2>
                {moodStats?.total_entries > 0 ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {MOOD_EMOJIS[Math.round(moodStats.average_mood) - 1]}
                      </span>
                      <div>
                        <p className="font-display text-xl font-semibold text-ink">
                          {moodStats.average_mood}/5
                        </p>
                        <p className="text-xs text-ink/50">
                          from {moodStats.total_entries} entries
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        moodStats.recent_trend === "improving"
                          ? "bg-[#6B8F71]/15 text-[#6B8F71]"
                          : moodStats.recent_trend === "declining"
                          ? "bg-[#B8493E]/15 text-[#B8493E]"
                          : "bg-ink/10 text-ink/50"
                      }`}
                    >
                      {moodStats.recent_trend === "improving" && "↑ "}
                      {moodStats.recent_trend === "declining" && "↓ "}
                      {moodStats.recent_trend}
                    </span>
                  </>
                ) : (
                  <p className="text-sm text-ink/50">No moods logged yet.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Segmented switcher for Tracker/Journal */}
        {(view === "tracker" || view === "journal") && (
          <div className="flex bg-rose-100 rounded-full p-1">
            <button
              onClick={() => setView("tracker")}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                view === "tracker"
                  ? "bg-white text-wine shadow-sm"
                  : "text-ink/50"
              }`}
            >
              Period Tracker
            </button>
            <button
              onClick={() => setView("journal")}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                view === "journal"
                  ? "bg-white text-wine shadow-sm"
                  : "text-ink/50"
              }`}
            >
              Mood Journal
            </button>
          </div>
        )}

        {/* Tracker view */}
        {view === "tracker" && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6">
            <button
              type="button"
              onClick={() => setShowCycleForm((v) => !v)}
              className="w-full flex items-center justify-between text-wine font-semibold"
            >
              <span className="flex items-center gap-2">
                <IconPlus className="w-4 h-4" />
                Log New Period
              </span>
              <IconChevronDown
                className={`w-4 h-4 transition-transform ${
                  showCycleForm ? "rotate-180" : ""
                }`}
              />
            </button>

            {showCycleForm && (
              <form onSubmit={handleLogCycle} className="space-y-4 mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink/70 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split("T")[0]}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-wine/30 outline-none bg-rose-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink/70 mb-1">
                      Period Length
                    </label>
                    <div className="relative">
                      <select
                        value={periodLength}
                        onChange={(e) => setPeriodLength(Number(e.target.value))}
                        className="w-full appearance-none px-4 py-2 pr-10 border border-rose-200 rounded-lg focus:ring-2 focus:ring-wine/30 outline-none bg-rose-50"
                      >
                        <option value="">Not sure yet</option>
                        {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                          <option key={d} value={d}>
                            {d} Days
                          </option>
                        ))}
                      </select>
                      <IconChevronDown className="w-4 h-4 text-ink/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-ink/40 -mt-2">
                  Periods must be at least 15 days apart.
                </p>
                <div>
                  <label className="block text-sm font-medium text-ink/70 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={cycleNotes}
                    onChange={(e) => setCycleNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-wine/30 outline-none bg-rose-50 resize-none"
                    placeholder="Any symptoms, thoughts, or notes..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-wine text-rose-50 py-3 rounded-full font-semibold hover:bg-wine-dark transition"
                >
                  Save
                </button>
              </form>
            )}

            <div className="mt-6">
              <h3 className="font-display font-semibold text-ink mb-3">
                Cycle History
              </h3>
              {cycles.length === 0 ? (
                <p className="text-sm text-ink/40 text-center py-6">
                  No periods logged yet. Add your first one above — LunaFlow
                  needs at least two to start predicting.
                </p>
              ) : (
                <div className="space-y-2">
                  {cycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className="flex justify-between items-center p-3.5 bg-rose-50 rounded-xl"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-semibold text-ink text-sm">
                            <IconDroplet className="w-3 h-3 text-[#B8493E]" />
                            {formatDate(cycle.start_date)}
                          </span>
                          {cycle.period_length_days && (
                            <span className="text-sm text-ink/60 mr-2">
                              {cycle.period_length_days} Days
                            </span>
                          )}
                        </div>
                        {cycle.notes && (
                          <p className="text-xs text-ink/50 mt-0.5 ml-5">
                            {cycle.notes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCycle(cycle.id)}
                        className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg bg-[#B8493E]/10 text-[#B8493E] hover:bg-[#B8493E]/20 transition shrink-0"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Journal view */}
        {view === "journal" && (
          <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6">
            <button
              type="button"
              onClick={() => setShowMoodForm((v) => !v)}
              className="w-full flex items-center justify-between text-wine font-semibold"
            >
              <span className="flex items-center gap-2">
                <IconPlus className="w-4 h-4" />
                Log Today's Mood
              </span>
              <IconChevronDown
                className={`w-4 h-4 transition-transform ${
                  showMoodForm ? "rotate-180" : ""
                }`}
              />
            </button>

            {showMoodForm && (
              <form onSubmit={handleLogMood} className="space-y-4 mt-5">
                <div>
                  <label className="block text-sm font-medium text-ink/70 mb-2">
                    Mood
                  </label>
                  <div className="flex gap-2">
                    {MOOD_EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setMoodScore(i + 1)}
                        className={`text-3xl p-2 rounded-lg transition ${
                          moodScore === i + 1
                            ? "bg-wine/15 scale-110"
                            : "hover:bg-ink/5"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink/70 mb-2">
                    Energy
                  </label>
                  <div className="flex gap-2">
                    {ENERGY_EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEnergyLevel(i + 1)}
                        className={`text-3xl p-2 rounded-lg transition ${
                          energyLevel === i + 1
                            ? "bg-wine/15 scale-110"
                            : "hover:bg-ink/5"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink/70 mb-1">
                    Note (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    className="w-full px-4 py-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-wine/30 outline-none bg-rose-50 resize-none"
                    placeholder="What's on your mind?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-wine text-rose-50 py-3 rounded-full font-semibold hover:bg-wine-dark transition"
                >
                  Save Mood
                </button>
              </form>
            )}

            <div className="mt-6">
              <h3 className="font-display font-semibold text-ink mb-3">
                Recent Moods
              </h3>
              {moods.length === 0 ? (
                <p className="text-sm text-ink/40 text-center py-6">
                  No moods logged yet. A few entries from now, you'll start
                  seeing patterns here.
                </p>
              ) : (
                <div className="space-y-2">
                  {moods.map((mood) => (
                    <div
                      key={mood.id}
                      className="flex items-center gap-3 p-3.5 bg-rose-50 rounded-xl"
                    >
                      <span className="text-xl">
                        {MOOD_EMOJIS[mood.mood_score - 1]}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink text-sm">
                            {mood.mood_score}/5
                          </span>
                          {mood.energy_level && (
                            <span className="text-xs text-ink/50">
                              · energy {mood.energy_level}/5
                            </span>
                          )}
                        </div>
                        {mood.note && (
                          <p className="text-xs text-ink/50">{mood.note}</p>
                        )}
                      </div>
                      <span className="text-xs text-ink/30 font-mono">
                        {formatDate(mood.logged_at)}
                      </span>
                      <button
                        onClick={() => handleDeleteMood(mood.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#B8493E]/10 text-[#B8493E] hover:bg-[#B8493E]/20 transition shrink-0"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav active={view} onNavigate={handleNavigate} onLogout={handleLogout} />
    </div>
  );
}
