import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../hooks/useGlobalReducer";
import "./login.css";

const BASE = import.meta.env.VITE_BACKEND_URL;

export default function Login() {
    const nav = useNavigate();
    const { search } = useLocation();
    const next = new URLSearchParams(search).get("next") || "/";
    const { actions } = useStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function submit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (actions?.login) {
                // Si tu store ya tiene login, úsalo
                await actions.login({ email, password });
            } else if (BASE) {
                // Fallback simple
                const r = await fetch(`${BASE}/api/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });
                const data = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(data?.message || "Credenciales inválidas");
                localStorage.setItem("tasky_user", JSON.stringify(data));
            } else {
                throw new Error("Configura VITE_BACKEND_URL o implementa actions.login");
            }
            nav(next, { replace: true });
        } catch (err) {
            setError(err.message || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    }

    const googleLogin = () => {
        if (!BASE) return setError("Configura VITE_BACKEND_URL");
        window.location.href = `${BASE}/api/auth/google/login?next=${encodeURIComponent(next)}`;
    };
    const facebookLogin = () => {
        if (!BASE) return setError("Configura VITE_BACKEND_URL");
        window.location.href = `${BASE}/api/auth/facebook/login?next=${encodeURIComponent(next)}`;
    };

    return (
        <div className="login">
            {/* Col 1: mensaje/hero */}
            <section className="login__hero">
                <div className="brand brand--glow" aria-hidden="true">
                    <span className="brand__mark" />
                    <span className="brand__word">Tas</span>
                    <span className="brand__accent">ky</span>
                </div>
                <h1 className="login__title">
                    Bienvenido de nuevo
                </h1>
                <p className="login__subtitle">
                    Accede a tus tareas, ofertas y perfil. Seguro y rápido.
                </p>

                <ul className="login__bullets">
                    <li>Inicia con email o con Google/Facebook</li>
                    <li>Tus datos están protegidos</li>
                    <li>Redirigimos al terminar</li>
                </ul>
            </section>

            {/* Col 2: tarjeta de login */}
            <section className="login__card">
                <form onSubmit={submit} noValidate>
                    <h2 className="login__cardTitle">Iniciar sesión</h2>

                    {error && <div role="alert" className="login__alert">{error}</div>}

                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            className="input"
                            type="email"
                            autoComplete="email"
                            placeholder="tucorreo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <div className="input input--withBtn">
                            <input
                                id="password"
                                type={showPwd ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
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
                    </div>

                    <div className="login__actions">
                        <button className="btn btn-primary" type="submit" disabled={loading}>
                            {loading ? "Entrando…" : "Entrar"}
                        </button>
                        <Link to="/register" className="btn btn-ghost">Crear cuenta</Link>
                    </div>

                    <div className="login__divider">
                        <span>o continúa con</span>
                    </div>

                    <div className="login__providers">
                        <button type="button" className="btn-social btn-google" onClick={googleLogin} disabled={loading}>
                            <GoogleIcon /> Google
                        </button>
                        <button type="button" className="btn-social btn-facebook" onClick={facebookLogin} disabled={loading}>
                            <FacebookIcon /> Facebook
                        </button>
                    </div>

                    <p className="login__hint">
                        ¿Olvidaste tu contraseña?&nbsp;
                        <Link to="/reset" className="link-inline">Recupérala</Link>
                    </p>
                </form>
            </section>
        </div>
    );
}

/* --- SVGs pequeños para los botones sociales --- */
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42v-.1H24v7.2h11.3C33.6 31.7 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.1-5.1C33.4 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.5 0 19.3-7.6 19.3-20 0-1.2-.1-2.4-.3-3.5z" />
            <path fill="#0F9D58" d="M6.3 14.7l5.9 4.3C13.8 16 18.4 13 24 13c3 0 5.7 1.1 7.8 2.9l5.1-5.1C33.4 6.1 28.9 4 24 4 15.6 4 8.6 8.9 6.3 14.7z" />
            <path fill="#31A9F7" d="M24 44c5.3 0 9.8-1.8 13-4.9l-6-4.8C29.4 35.6 26.9 36.5 24 36.5c-5.3 0-9.8-3.6-11.4-8.5l-6.2 4.8C8.6 39.1 15.8 44 24 44z" />
            <path fill="#F44336" d="M43.6 20.5H42v-.1H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12 0-2 .5-3.9 1.4-5.6l-6-4.4C5 15.9 4 19.8 4 24c0 11.1 8.9 20 20 20 10.5 0 19.3-7.6 19.3-20 0-1.2-.1-2.4-.3-3.5z" />
        </svg>
    );
}
function FacebookIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18 4.39 23 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3 1.8-4.66 4.56-4.66 1.32 0 2.7.23 2.7.23v2.97h-1.52c-1.5 0-1.97.94-1.97 1.9v2.28h3.35l-.54 3.49h-2.81V24C19.61 23 24 18 24 12.07z" />
        </svg>
    );
}