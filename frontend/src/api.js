const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "carbontrack.accessToken";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error("Cannot reach CarbonTrack API. Start the Spring Boot backend on port 8080 and retry.");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      window.dispatchEvent(new Event("carbontrack:unauthorized"));
    }
    const message = payload && typeof payload === "object"
      ? payload.error || payload.message || `Request failed (${response.status})`
      : payload || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

export const api = {
  login: (username, password) => request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password })
  }),
  register: (username, email, password) => request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password })
  }),
  activities: () => request("/api/activities"),
  createActivity: (payload) => request("/api/activities", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  analytics: (period, startDate, endDate) => request(
    `/api/analytics/footprint?period=${encodeURIComponent(period)}&startDate=${startDate}&endDate=${endDate}`
  ),
  goals: () => request("/api/goals"),
  createGoal: (payload) => request("/api/goals", {
    method: "POST",
    body: JSON.stringify(payload)
  }),
  goalProgress: (id) => request(`/api/goals/${id}/progress`),
  recommendations: () => request("/api/recommendations"),
  badges: () => request("/api/badges"),
  benchmark: (startDate, endDate) => request(
    `/api/analytics/benchmark?startDate=${startDate}&endDate=${endDate}`
  ),
  profile: () => request("/api/users/me"),
  updateProfile: (payload) => request("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(payload)
  })
};
