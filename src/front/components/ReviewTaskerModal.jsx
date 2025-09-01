// src/front/components/ReviewTaskerModal.jsx
import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useTaskSession } from "../context/TaskSessionContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function ReviewTaskerModal({
    show,
    onHide,
    taskId,
    taskerId,
    dealId,
    onCreated,
    demo = false,
}) {
    const session = useTaskSession?.() || null;
    const effTaskId = taskId ?? session?.taskId ?? null;
    const effWorkerId = taskerId ?? session?.assignedTaskerId ?? null;
    const effDealId = dealId ?? session?.dealId ?? null;

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [locked, setLocked] = useState(false); // 🔒 ya calificado (éxito o 409)

    const reset = () => {
        setRating(5);
        setComment("");
        setError("");
        setLocked(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (locked) return; // evita doble submit cuando ya está bloqueado
        setSubmitting(true);
        setError("");

        try {
            const ratingNum = Math.max(1, Math.min(5, parseInt(rating, 10) || 0));
            const commentStr = comment.trim();
            if (!commentStr) throw new Error("El comentario es obligatorio");
            if (!effTaskId) throw new Error("Falta taskId");
            if (!effWorkerId) throw new Error("Falta worker_id (tasker asignado)");

            if (demo) {
                await new Promise((r) => setTimeout(r, 600));
                const fake = {
                    id: Math.floor(Math.random() * 10000),
                    task_id: Number(effTaskId),
                    tasker_id: Number(effWorkerId),
                    rating: ratingNum,
                    comment: commentStr,
                    target: "tasker",
                    created_at: new Date().toISOString(),
                };
                onCreated?.(fake);
                setLocked(true);   // 🔒 bloquea el modal tras “guardar”
                // Opcional: cerrar automáticamente
                onHide?.();
                return;
            }

            const base = (API_BASE || "").replace(/\/+$/, "");
            const url = `${base}/api/tasks/${effTaskId}/reviews`;

            const body = {
                target: "tasker",
                task_id: Number(effTaskId),
                worker_id: Number(effWorkerId),
                rating: ratingNum,
                comment: commentStr,
            };
            if (effDealId) body.deal_id = Number(effDealId);

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const ct = res.headers.get("content-type") || "";
            const raw = await res.text();
            const payload = ct.includes("application/json") ? JSON.parse(raw) : raw;

            if (!res.ok) {
                // 🔴 Manejo especial del 409: ya existe review → bloquear, avisar arriba y no tratar como error fatal
                if (res.status === 409) {
                    setLocked(true);
                    setError("");                 // limpia error visible
                    onCreated?.();                // avisa al padre para deshabilitar botón
                    // Opcional: auto-cerrar
                    onHide?.();
                    return;
                }
                const msg =
                    typeof payload === "string"
                        ? `HTTP ${res.status}: ${payload.slice(0, 160)}`
                        : payload?.message || payload?.detail || `HTTP ${res.status}`;
                throw new Error(msg);
            }

            onCreated?.(payload);
            setLocked(true); // 🔒 bloquea tras éxito
            // Opcional: auto-cerrar
            onHide?.();
        } catch (err) {
            console.error("Review POST failed:", err);
            setError(err.message || "No se pudo guardar la calificación");
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit =
        !submitting &&
        !locked &&                 // 🔒 no permitir enviar si ya calificado
        comment.trim().length > 0 &&
        Number(rating) >= 1 &&
        Number(rating) <= 5;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Calificar tasker {demo && <small className="text-muted">(demo)</small>}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {locked && (
                        <Alert variant="success" className="mb-3">
                            Este tasker ya fue calificado para esta tarea.
                        </Alert>
                    )}
                    {error && !locked && (
                        <Alert variant="danger" className="mb-3">
                            {error}
                        </Alert>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Puntuación (1 a 5)</Form.Label>
                        <Form.Select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            disabled={submitting || locked}
                            required
                        >
                            <option value={5}>5 - Excelente</option>
                            <option value={4}>4 - Muy bueno</option>
                            <option value={3}>3 - Bueno</option>
                            <option value={2}>2 - Regular</option>
                            <option value={1}>1 - Malo</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-2">
                        <Form.Label>Comentario</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Describe brevemente tu experiencia"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={submitting || locked}
                            required
                        />
                    </Form.Group>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={submitting}>
                        Cerrar
                    </Button>
                    <Button type="submit" variant="primary" disabled={!canSubmit}>
                        {locked ? "Ya calificado" : (submitting ? "Guardando..." : "Guardar calificación")}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
