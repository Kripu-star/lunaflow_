const API_URL = "https://lunaflow-api-28mh.onrender.com";

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && token) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  return response;
}

export async function register(email, password, fullName) {
  return apiCall("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
}

export async function login(email, password) {
  const res = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) {
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
  }
  return res;
}

export async function getMe() {
  return apiCall("/auth/me");
}

export async function getCycles() {
  return apiCall("/cycles");
}

export async function createCycle(startDate, notes, periodLengthDays) {
  return apiCall("/cycles", {
    method: "POST",
    body: JSON.stringify({
      start_date: startDate,
      notes,
      period_length_days: periodLengthDays,
    }),
  });
}

export async function getPrediction() {
  return apiCall("/cycles/prediction");
}
export async function getMoods() {
  return apiCall("/moods");
}

export async function createMood(moodScore, energyLevel, note) {
  return apiCall("/moods", {
    method: "POST",
    body: JSON.stringify({
      mood_score: moodScore,
      energy_level: energyLevel,
      note,
    }),
  });
}

export async function getMoodStats() {
  return apiCall("/moods/stats");
}
export async function getCyclePhase() {
  return apiCall("/cycles/phase");
}
export async function deleteCycle(cycleId) {
  return apiCall(`/cycles/${cycleId}`, {
    method: "DELETE",
  });
}
