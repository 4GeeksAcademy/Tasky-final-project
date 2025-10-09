// src/front/api/auth.js
import { getBackendURL } from "../components/BackendURL";

const BASE_RAW =
  (typeof getBackendURL === "function" ? getBackendURL() : "") ||
  import.meta.env.VITE_BACKEND_URL ||
  "";
const BASE = BASE_RAW.replace(/\/$/, ""); // normalize
const USE_MOCK = false; // 🔴 turn off so you actually hit the backend

export async function apiRegister({ name, email, password, role }) {
  if (USE_MOCK)
    return {
      id: 1,
      username: name,
      email,
      role: role || "client",
      token: "mock",
    };

  const res = await fetch(`${BASE}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // ✅ backend expects "username"
    body: JSON.stringify({ username: name, email, password, role }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // backend uses {error} or {message}
    throw new Error(
      data?.error || data?.message || "No se pudo crear la cuenta"
    );
  }
  return data; // created user (no password)
}

export async function apiLogin({ email, password }) {
  if (USE_MOCK)
    return { id: 1, username: "Demo", email, role: "client", token: "mock" };

  const res = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Credenciales inválidas");
  }
  return data;
}

// (Optional) keep these mocks for later when you implement social login:
export async function apiGoogleLogin(idToken) {
  /* unchanged for now */
}
export async function apiFacebookLogin(accessToken) {
  /* unchanged for now */
}
