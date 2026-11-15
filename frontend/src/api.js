const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const TOKEN_KEY = "carbontrack_access_token";
const USER_KEY = "carbontrack_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function storeUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function request(path, options = {}, {
  unauthorizedMessage,
  authenticated = true,
} = {}) {
  const token = authenticated ? getToken() : null;

  const headers = {
    Accept: "application/json",
    ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "Cannot connect to CarbonTrack backend. Check that the Spring Boot backend is running on port 8080 and that your Vite proxy or API base URL is configured."
    );
  }

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.detail ||
      (typeof data === "string" ? data : null) ||
      `Request failed with status ${response.status}`;

    if (response.status === 401) {
      if (unauthorizedMessage || !authenticated) {
        throw new Error(unauthorizedMessage || message);
      }

      logout();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("carbontrack:unauthorized"));
      }
      throw new Error("Your session may have expired. Please sign in again.");
    }

    throw new Error(message);
  }

  return data;
}

// Authentication

export async function login(credentials) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  }, {
    unauthorizedMessage: "Invalid username/email or password. Please try again.",
  });

  if (!result?.accessToken) {
    throw new Error("Login succeeded but the backend did not return an access token.");
  }

  // Do not mark the UI as authenticated until the protected profile endpoint
  // confirms that the newly issued token is valid and returns the real user.
  localStorage.setItem(TOKEN_KEY, result.accessToken);
  localStorage.removeItem(USER_KEY);

  try {
    const profile = await getMyProfile();
    if (!profile?.username) {
      throw new Error("The backend returned an incomplete user profile. Please try signing in again.");
    }
    storeUser(profile);
    return profile;
  } catch (error) {
    logout();
    throw new Error(error?.message || "Could not load your account profile. Please sign in again.");
  }
}

export async function register(details) {
  await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(details),
  });

  return login({
    username: details.username,
    password: details.password,
  });
}

export async function updatePassword(payload) {
  return request("/api/auth/change-password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function requestPasswordReset(email) {
  return request("/api/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  }, { authenticated: false });
}

export async function confirmPasswordReset(token, newPassword) {
  return request("/api/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  }, { authenticated: false });
}

// User Profile

export async function getMyProfile() {
  return request("/api/users/me");
}

export async function updateMyProfile(profile) {
  const result = await request("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(profile),
  });

  if (result) {
    storeUser(result);
  }

  return result;
}

// Activities

export async function getActivities() {
  return request("/api/activities");
}

export async function addActivity(activity) {
  return request("/api/activities", {
    method: "POST",
    body: JSON.stringify(activity),
  });
}

export async function updateActivity(activityId, activity) {
  return request(`/api/activities/${activityId}`, {
    method: "PUT",
    body: JSON.stringify(activity),
  });
}

export async function deleteActivity(activityId) {
  return request(`/api/activities/${activityId}`, {
    method: "DELETE",
  });
}

// Emission Factors

export async function getEmissionFactors() {
  return request("/api/emission-factors");
}

// Footprint Analytics

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getFootprintAnalytics(period = "monthly", customStart = null, customEnd = null) {
  const end = customEnd ? new Date(customEnd) : new Date();
  const start = customStart ? new Date(customStart) : new Date(end);

  if (!customStart) {
    if (period === "daily") {
      // today only
    } else if (period === "weekly") {
      start.setDate(start.getDate() - 6);
    } else {
      start.setDate(1);
    }
  }

  const params = new URLSearchParams({
    period,
    startDate: localDateString(start),
    endDate: localDateString(end),
  });

  return request(`/api/analytics/footprint?${params.toString()}`);
}

// Goals

export async function getGoals() {
  return request("/api/goals");
}

export async function createGoal(goal) {
  return request("/api/goals", {
    method: "POST",
    body: JSON.stringify(goal),
  });
}

export async function getGoal(goalId) {
  return request(`/api/goals/${goalId}`);
}

export async function updateGoal(goalId, goal) {
  return request(`/api/goals/${goalId}`, {
    method: "PUT",
    body: JSON.stringify(goal),
  });
}

export async function deleteGoal(goalId) {
  return request(`/api/goals/${goalId}`, {
    method: "DELETE",
  });
}

export async function getGoalProgress(goalId) {
  return request(`/api/goals/${goalId}/progress`);
}

// Badges

export async function getMyBadges() {
  return request("/api/badges/me");
}

export async function getAllBadges() {
  return request("/api/badges");
}

// Benchmarking & Community Leaderboard

export async function getMyBenchmark() {
  return request("/api/benchmarking/me");
}

export async function getWeeklyRecommendations() {
  return request("/api/recommendations/weekly");
}

// Organisation Dashboard & CSR Reports

export async function getOrganisationSummary() {
  return request("/api/organisations/summary");
}

export async function getOrganisationEmployees() {
  return request("/api/organisations/employees");
}

export async function downloadCsrReport() {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE}/api/organisations/csr-report`, {
    headers,
  });

  if (!response.ok) {
    let msg = "Failed to download CSR report";
    try {
      const data = await response.json();
      msg = data.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CSR_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
