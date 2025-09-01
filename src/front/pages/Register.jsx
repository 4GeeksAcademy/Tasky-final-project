// src/front/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRegister } from "../api/auth";
import { useStore } from "../hooks/useGlobalReducer";
import "./auth.css";

const BASE = import.meta.env.VITE_BACKEND_URL;

export default function Register() {
  const nav = useNavigate();
  const { actions } = useStore();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido";
    if (form.password.length < 6) e.password = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function submit(ev) {
    ev.preventDefault();
    setApiError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await apiRegister({ ...form, role: "client" });
      actions.login(user);
      nav("/", { replace: true });
    } catch (err) {
      setApiError(err?.message || "No pudimos crear tu cuenta");
    } finally {
      setLoading(false);
    }
  }

  const google = () => {
    if (!BASE) return setApiError("Configura VITE_BACKEND_URL");
    window.location.href = `${BASE}/api/auth/google/login`;
  };
  const facebook = () => {
    if (!BASE) return setApiError("Configura VITE_BACKEND_URL");
    window.location.href = `${BASE}/api/auth/facebook/login`;
  };

  return (
    <div className="auth">
      {/* Col 1: hero/brand */}
      <section className="auth__hero">
        <div className="brand brand--glow" aria-hidden="true">
          <span className="brand__mark" />
          <span className="brand__word">Tas</span>
          <span className="brand__accent">ky</span>
        </div>

        <h1 className="auth__title">Sign up to Tasky</h1>
        <p className="auth__subtitle">
          Crea tu cuenta y empieza a publicar u ofertar tareas.
        </p>

        <ul className="auth__bullets">
          <li>Un solo perfil para publicar y ofertar</li>
          <li>Inicio con Google o Facebook</li>
          <li>Seguridad y privacidad primero</li>
        </ul>
      </section>

      {/* Col 2: tarjeta */}
      <section className="auth__card">
        <form onSubmit={submit} noValidate>
          <h2 className="auth__cardTitle">Crea tu cuenta</h2>

          {apiError && <div role="alert" className="auth__alert">{apiError}</div>}

          <div className="field">
            <label htmlFor="name" className="auth-label">Full name*</label>
            <input
              id="name"
              className={`input ${errors.name ? "has-error" : ""}`}
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={loading}
              required
            />
            {errors.name && <div className="auth-error">{errors.name}</div>}
          </div>

          <div className="field">
            <label htmlFor="email" className="auth-label">Email*</label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? "has-error" : ""}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={loading}
              required
              autoComplete="email"
            />
            {errors.email && <div className="auth-error">{errors.email}</div>}
          </div>

          <div className="field">
            <label htmlFor="password" className="auth-label">Password*</label>
            <div className={`input input--withBtn ${errors.password ? "has-error" : ""}`}>
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input__addon"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={-1}
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <div className="auth-error">{errors.password}</div>}
          </div>

          {/* Mock reCAPTCHA */}
          <div className="captcha">
            <div className="captcha__check" />
            <span>No soy un robot (placeholder)</span>
          </div>

          <div className="auth__actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creando…" : "Sign up"}
            </button>
            <span className="auth__muted">
              ¿Ya tienes cuenta? <Link to="/login" className="link-inline">Log in</Link>
            </span>
          </div>

          <div className="auth__divider"><span>o continúa con</span></div>

          <div className="auth__providers">
            <button type="button" className="btn-social" onClick={google} disabled={loading}>
              <GoogleIcon /> Continue with Google
            </button>
            <button type="button" className="btn-social" onClick={facebook} disabled={loading}>
              <FacebookIcon /> Continue with Facebook
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* --- iconos --- */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42v-.1H24v7.2h11.3C33.6 31.7 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.1-5.1C33.4 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.5 0 19.3-7.6 19.3-20 0-1.2-.1-2.4-.3-3.5z"/>
      <path fill="#0F9D58" d="M6.3 14.7l5.9 4.3C13.8 16 18.4 13 24 13c3 0 5.7 1.1 7.8 2.9l5.1-5.1C33.4 6.1 28.9 4 24 4 15.6 4 8.6 8.9 6.3 14.7z"/>
      <path fill="#31A9F7" d="M24 44c5.3 0 9.8-1.8 13-4.9l-6-4.8C29.4 35.6 26.9 36.5 24 36.5c-5.3 0-9.8-3.6-11.4-8.5l-6.2 4.8C8.6 39.1 15.8 44 24 44z"/>
      <path fill="#F44336" d="M43.6 20.5H42v-.1H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12 0-2 .5-3.9 1.4-5.6l-6-4.4C5 15.9 4 19.8 4 24c0 11.1 8.9 20 20 20 10.5 0 19.3-7.6 19.3-20 0-1.2-.1-2.4-.3-3.5z"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18 4.39 23 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3 1.8-4.66 4.56-4.66 1.32 0 2.7.23 2.7.23v2.97h-1.52c-1.5 0-1.97.94-1.97 1.9v2.28h3.35l-.54 3.49h-2.81V24C19.61 23 24 18 24 12.07z"/>
    </svg>
  );
}