// src/front/components/SendOfferModal.jsx
import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Alert, InputGroup } from "react-bootstrap";
import { useStore } from "../hooks/useGlobalReducer";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function SendOfferModal({ show, onHide, taskId, onCreated, existingOffer }) {
    const { store } = useStore();
    const user = store?.user; // { id, role }

    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Prefill si estamos en modo actualización
    useEffect(() => {
        if (existingOffer) {
            setAmount(String(existingOffer.amount));
            setMessage(existingOffer.message || "");
        } else {
            setAmount("");
            setMessage("");
        }
        setError("");
    }, [existingOffer, show]);

    const reset = () => {
        setAmount("");
        setMessage("");
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            if (!user?.id) throw new Error("No hay usuario (tasker) en sesión");

            const nAmount = Number(String(amount).replace(",", "."));
            if (!Number.isFinite(nAmount) || nAmount <= 0) {
                throw new Error("Monto inválido");
            }
            const msg = message.trim();
            if (!msg) throw new Error("El mensaje es obligatorio");

            // Si existe oferta previa: obliga a cambiar algo (monto o mensaje)
            if (existingOffer) {
                const sameAmount = Number(existingOffer.amount) === nAmount;
                const sameMessage = (existingOffer.message || "").trim() === msg;
                if (sameAmount && sameMessage) {
                    throw new Error("Ya ofertaste ese mismo monto y mensaje. Cambia el monto o el mensaje.");
                }
            }

            const base = (API_BASE || "").replace(/\/+$/, "");
            const isUpdate = !!existingOffer;
            const url = isUpdate
                ? `${base}/api/tasks/${taskId}/offers/${existingOffer.id}`
                : `${base}/api/tasks/${taskId}/offers`;

            const method = isUpdate ? "PUT" : "POST";
            const body = {
                tasker_id: user.id,     // si tu backend ya infiere el tasker por sesión, puedes omitirlo
                amount: nAmount,
                message: msg,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const ct = res.headers.get("content-type") || "";
            const raw = await res.text();
            const payload = ct.includes("application/json") ? JSON.parse(raw) : raw;

            if (!res.ok) {
                const msgErr =
                    typeof payload === "string"
                        ? `HTTP ${res.status}: ${payload.slice(0, 200)}`
                        : payload?.message || payload?.detail || `HTTP ${res.status}`;
                throw new Error(msgErr);
            }

            onCreated?.(payload);
            reset();
            onHide?.();
        } catch (err) {
            setError(err.message || "No se pudo enviar/actualizar la oferta");
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit =
        !submitting &&
        !!user?.id &&
        amount !== "" &&
        Number(String(amount).replace(",", ".")) > 0 &&
        message.trim().length > 0;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{existingOffer ? "Actualizar oferta" : "Enviar oferta"}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                    {!user?.id && (
                        <Alert variant="warning" className="mb-3">
                            No hay usuario en sesión. Haz un <code>LOGIN</code> demo en tu store para probar.
                        </Alert>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Monto</Form.Label>
                        <InputGroup>
                            <InputGroup.Text>$</InputGroup.Text>
                            <Form.Control
                                type="number"
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Tu oferta"
                                required
                                disabled={submitting}
                            />
                        </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-2">
                        <Form.Label>Mensaje</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Nota breve"
                            required
                            disabled={submitting}
                        />
                    </Form.Group>

                    {user?.id && (
                        <div className="small text-muted">
                            Se enviará como <strong>tasker #{user.id}</strong>.
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={!canSubmit}>
                        {submitting ? (existingOffer ? "Actualizando..." : "Enviando...") : (existingOffer ? "Actualizar" : "Enviar")}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}