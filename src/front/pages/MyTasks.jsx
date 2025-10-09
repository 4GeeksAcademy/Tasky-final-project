// src/front/pages/MyTasks.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "../hooks/useGlobalReducer";
import { getTasksByUser } from "../api/tasks";

export default function MyTasks() {
  const { store } = useStore();
  const { userId } = useParams();        // /users/:userId/tasks
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      setErr("");
      setLoading(true);
      try {
        // If param missing, fall back to logged-in user
        const id = Number(userId) || store?.user?.id;
        if (!id) {
          // Shouldn’t happen if this page is under <Protected/>, but guard anyway
          nav("/login?next=/users/me/tasks", { replace: true });
          return;
        }
        const data = await getTasksByUser(id, { /* optional filters */ });
        if (live) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (live) setErr(e.message || "Error cargando tareas");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [userId, store?.user?.id, nav]);

  return (
    <div style={{ maxWidth: 960, margin: "2rem auto" }}>
      <h2>Mis tareas</h2>

      {loading && <p>Cargando…</p>}
      {err && <p style={{ color: "#b91c1c" }}>{err}</p>}

      {!loading && !err && items.length === 0 && (
        <p>No tienes tareas todavía.</p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((t) => (
          <article
            key={t.id}
            role="button"
            tabIndex={0}
            onClick={() => nav(`/tasks/${t.id}`)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && nav(`/tasks/${t.id}`)
            }
            className="card"
            style={{ padding: 16, cursor: "pointer" }}
            aria-label={`Abrir tarea: ${t.title}`}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{t.title}</h3>
              {t.price != null && <b>${t.price}</b>}
            </div>
            <p style={{ margin: "6px 0 0" }}>
              {t.description || "Sin descripción"}
            </p>
            <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
              <span>📍 {t.location || "Remoto"}</span>
              {t.status && (
                <span style={{ marginLeft: 8, opacity: 0.9 }}>
                  • {t.status}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
