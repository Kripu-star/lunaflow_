import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, getCycles, createCycle, getPrediction } from "../api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [userRes, cyclesRes, predRes] = await Promise.all([
        getMe(),
        getCycles(),
        getPrediction(),
      ]);

      if (!userRes || !userRes.ok) {
        navigate("/login");
        return;
      }

      setUser(await userRes.json());
      setCycles(await cyclesRes.json());
      setPrediction(await predRes.json());
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogCycle(e) {
    e.preventDefault();
    const res = await createCycle(new Date(startDate).toISOString(), notes);
    if (res.ok) {
      setShowForm(false);
      setStartDate("");
      setNotes("");
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
      month: "long",
      day: "numeric",
    });
  }

  function daysUntil(dateStr) {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <p className="text-purple-600 text-lg">Loading...</p>
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
              onClick={handleLogout}
              className="text-sm text-red-500 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Prediction Card */}
        {prediction?.predicted_next_start && (
          <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
            <h2 className="text-lg font-semibold text-purple-800 mb-2">
              Next Period Prediction
            </h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {formatDate(prediction.predicted_next_start)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  ~{daysUntil(prediction.predicted_next_start)} days from now •
                  Avg cycle: {prediction.average_cycle_length_days} days
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  prediction.confidence === "high"
                    ? "bg-green-100 text-green-700"
                    : prediction.confidence === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {prediction.confidence} confidence
              </div>
            </div>
          </div>
        )}

        {/* Log New Cycle Button / Form */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Cycle History */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Cycle History
          </h2>
          {cycles.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No cycles logged yet. Start by logging your first period above.
            </p>
          ) : (
            <div className="space-y-3">
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
                  <span className="text-xs text-gray-400">
                    #{cycle.id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}