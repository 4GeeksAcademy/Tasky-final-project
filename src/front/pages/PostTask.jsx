// src/front/pages/PostTask.jsx
import { useState } from "react";

export default function PostTask() {
    const [form, setForm] = useState({
        title: "", description: "", location: "", price: "", status: "pending"
    });
    const [msg, setMsg] = useState("");

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    async function submit(e) {
        e.preventDefault();
        setMsg("");
        try {
            // publisher_id DEMO: 1 (el seed crea usuario demo con id=1)
            const created = await createTask({
                title: form.title,
                description: form.description,
                location: form.location || undefined,
                price: form.price ? Number(form.price) : undefined,
                status: form.status,
                publisher_id: 1,
            });
            setMsg(`Task creada (id ${created.id}). Abre "Browse tasks" para verla.`);
            setForm({ title: "", description: "", location: "", price: "", status: "pending" });
        } catch (e) {
            setMsg("Error: " + (e.message || "no se pudo crear"));
        }
    }

    return (
        <div className="container" style={{ maxWidth: 700, margin: "2rem auto" }}>
            <h2>Genera una disputa</h2>
            <h6 className="text-muted"> task #43</h6>
            <form onSubmit={submit} className="card text-white" style={{ padding: 16, display: "grid", gap: 10 }}>
                <label>Motivo</label>
                <input value={form.title} onChange={set("title")} placeholder="Ej. El tasker no se presentó" required />

                <label>Detalles </label>
                <textarea rows={4} value={form.description} onChange={set("description")}
                    placeholder="Detalles del problema ocurrido" required />

                <div className="my-3">
                    <label className="form-check-label my-2" htmlFor="fotos">
                        Sube algunas fotos si tienes evidencia que ayude a entender el problema
                    </label>
                    <input type="file" className="form-control" id="fotos" multiple />
                </div>
                <button type="submit" className="btn">Abrir disputa</button>
                {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
            </form>
        </div>
    );
}