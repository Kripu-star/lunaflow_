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
} from "../api";
import { getCyclePhase } from "../api";

const MOOD_EMOJIS = ["😢", "😟", "😐", "😊", "😁"];
const ENERGY_EMOJIS = ["🪫", "😴", "⚡", "🔥", "💥"];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [moods, setMoods] = useState([]);
  const [moodStats, setMoodStats] = useState(null);
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [cycleNotes, setCycleNotes] = useState("");
  const [moodScore, setMoodScore] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [moodNote, setMoodNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cycles");
  const navigate = useNavigate();
  const [periodLength, setPeriodLength] = useState("");
  const [cyclePhase, setCyclePhase] = useState(null);

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
    if (res.ok) {
      setShowMoodForm(false);
      setMoodScore(3);
      setEnergyLevel(3);
      setMoodNote("");
      loadData();
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function daysUntil(dateStr) {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl mb-2">🌙</p>
          <p className="text-purple-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-purple-800">🌙 LunaFlow</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Hi, {user?.full_name || user?.email}
            </span>
            <button
              onClick={() => navigate("/chat")}
              className="text-sm bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition"
            >
              💬 AI Companion
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Top Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prediction Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
            <h2 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">
              Next Period
            </h2>
            {prediction?.predicted_next_start ? (
              <>
                <p className="text-2xl font-bold text-gray-800">
                  {formatDate(prediction.predicted_next_start)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {daysUntil(prediction.predicted_next_start)} days away • Avg{" "}
                  {prediction.average_cycle_length_days} day cycle
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    prediction.confidence === "high"
                      ? "bg-green-100 text-green-700"
                      : prediction.confidence === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {prediction.confidence} confidence
                </span>
              </>
            ) : (
              <p className="text-gray-400">
                Log at least 2 cycles for a prediction
              </p>
            )}
          </div>

          {/* Mood Stats Card */}
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-pink-500">
            <h2 className="text-sm font-semibold text-pink-600 uppercase tracking-wide mb-2">
              Mood Overview
            </h2>
            {moodStats?.total_entries > 0 ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {MOOD_EMOJIS[Math.round(moodStats.average_mood) - 1]}
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {moodStats.average_mood}/5
                    </p>
                    <p className="text-sm text-gray-500">
                      avg from {moodStats.total_entries} entries
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    moodStats.recent_trend === "improving"
                      ? "bg-green-100 text-green-700"
                      : moodStats.recent_trend === "declining"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {moodStats.recent_trend === "improving" && "↑ "}
                  {moodStats.recent_trend === "declining" && "↓ "}
                  {moodStats.recent_trend}
                </span>
              </>
            ) : (
              <p className="text-gray-400">No moods logged yet</p>
            )}
          </div>
          {/* Cycle Phase Card */}
{cyclePhase && cyclePhase.phase !== "unknown" && (
  <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-pink-400 md:col-span-2">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-pink-600 uppercase tracking-wide mb-1">
          Current Phase
        </h2>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{cyclePhase.emoji}</span>
          <div>
            <p className="text-xl font-bold text-gray-800">
              {cyclePhase.phase}
            </p>
            <p className="text-sm text-gray-500">
              Day {cyclePhase.day_of_cycle} of your cycle
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          {cyclePhase.description}
        </p>
        {cyclePhase.tips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cyclePhase.tips.map((tip, i) => (
              <span
                key={i}
                className="text-xs bg-pink-50 text-pink-700 px-2 py-1 rounded-full"
              >
                {tip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("cycles")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              activeTab === "cycles"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 hover:bg-purple-50"
            }`}
          >
            Period Tracker
          </button>
          <button
            onClick={() => setActiveTab("moods")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              activeTab === "moods"
                ? "bg-pink-600 text-white"
                : "bg-white text-gray-600 hover:bg-pink-50"
            }`}
          >
            Mood Journal
          </button>
        </div>

        {/* Cycles Tab */}
        {activeTab === "cycles" && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            {!showCycleForm ? (
              <button
                onClick={() => setShowCycleForm(true)}
                className="w-full py-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:bg-purple-50 transition font-medium"
              >
                + Log New Period
              </button>
            ) : (
              <form onSubmit={handleLogCycle} className="space-y-4">
                <h3 className="font-semibold text-gray-800">Log a Period</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                  />
                 <p className="text-xs text-gray-400 mt-1">
                  One cycle per day maximum. Cycles should be at least 15 days apart.
                </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How many days did it last?
                  </label>
                  <select
                    value={periodLength}
                    onChange={(e) => setPeriodLength(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                  >
                    <option value="">Not sure yet</option>
                    {[2,3,4,5,6,7,8].map(d => (
                      <option key={d} value={d}>{d} days</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={cycleNotes}
                    onChange={(e) => setCycleNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                    placeholder="e.g. heavy flow, cramps"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCycleForm(false)}
                    className="text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Cycle History
              </h3>
              {cycles.length === 0 ? (
                <p className="text-gray-400 text-center py-6">
                  No cycles logged yet
                </p>
              ) : (
                <div className="space-y-2">
                  {cycles.map((cycle) => (
                    <div
                      key={cycle.id}
                      className="flex justify-between items-center p-3 bg-purple-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {formatDate(cycle.start_date)}
                        </p>
                        {cycle.notes && (
                          <p className="text-sm text-gray-500">{cycle.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Moods Tab */}
        {activeTab === "moods" && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            {!showMoodForm ? (
              <button
                onClick={() => setShowMoodForm(true)}
                className="w-full py-3 border-2 border-dashed border-pink-300 rounded-xl text-pink-600 hover:bg-pink-50 transition font-medium"
              >
                + Log Today's Mood
              </button>
            ) : (
              <form onSubmit={handleLogMood} className="space-y-4">
                <h3 className="font-semibold text-gray-800">
                  How are you feeling?
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            ? "bg-pink-100 scale-110"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            ? "bg-pink-100 scale-110"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={moodNote}
                    onChange={(e) => setMoodNote(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 outline-none"
                    placeholder="What's on your mind?"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition"
                  >
                    Save Mood
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMoodForm(false)}
                    className="text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Recent Moods
              </h3>
              {moods.length === 0 ? (
                <p className="text-gray-400 text-center py-6">
                  No moods logged yet. Start tracking how you feel!
                </p>
              ) : (
                <div className="space-y-2">
                  {moods.map((mood) => (
                    <div
                      key={mood.id}
                      className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg"
                    >
                      <span className="text-2xl">
                        {MOOD_EMOJIS[mood.mood_score - 1]}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            Mood: {mood.mood_score}/5
                          </span>
                          {mood.energy_level && (
                            <span className="text-sm text-gray-500">
                              • Energy: {mood.energy_level}/5
                            </span>
                          )}
                        </div>
                        {mood.note && (
                          <p className="text-sm text-gray-500">{mood.note}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(mood.logged_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}