// src/front/components/OfferList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, ListGroup, Spinner } from "react-bootstrap";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function OfferList({
    taskId,
    canAccept = false,                // true si el viewer es el publisher
    onAccepted = () => { },            // callback(deal) tras aceptar oferta
}) {
    const base = useMemo(() => (API_BASE || "").replace(/\/+$/, ""), []);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [acceptingId, setAcceptingId] = useState(null);
    const [flash, setFlash] = useState("");

    // cache simple de usernames por id
    const [usernames, setUsernames] = useState({});

    useEffect(() => {
        let alive = true;
        const run = async () => {
            setLoading(true);
            setErr("");
            try {
                const r = await fetch(`${base}/api/tasks/${taskId}/offers`);
                const ct = r.headers.get("content-type") || "";
                const raw = await r.text();
                const data = ct.includes("application/json") ? JSON.parse(raw) : raw;
                if (!r.ok) throw new Error(typeof data === "string" ? raw : (data?.message || `HTTP ${r.status}`));
                if (!alive) return;
                setOffers(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!alive) return;
                setErr(e.message || "No se pudieron cargar las ofertas");
            } finally {
                if (alive) setLoading(false);
            }
        };
        run();
        return () => { alive = false; };
    }, [base, taskId]);

    // obtener usernames (opcional; si falla, mostramos el id)
    useEffect(() => {
        const ids = [...new Set(offers.map(o => o.tasker_id).filter(Boolean))].filter(
            (id) => usernames[id] == null
        );
        if (ids.length === 0) return;

        ids.forEach(async (id) => {
            try {
                const r = await fetch(`${base}/api/users/${id}`);
                if (!r.ok) return;
                const u = await r.json();
                setUsernames((prev) => ({ ...prev, [id]: u?.username || String(id) }));
            } catch {
                setUsernames((prev) => ({ ...prev, [id]: String(id) }));
            }
        });
    }, [base, offers, usernames]);

    const acceptOffer = async (offer) => {
        if (!canAccept) return;
        setAcceptingId(offer.id);
        setErr("");
        setFlash("");
        try {
            const body = {
                tasker_id: offer.tasker_id,
                offer_id: offer.id,
                // optional: fixed_price: offer.amount,
            };
            const r = await fetch(`${base}/api/tasks/${taskId}/deals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const ct = r.headers.get("content-type") || "";
            const raw = await r.text();
            const data = ct.includes("application/json") ? JSON.parse(raw) : raw;
            if (!r.ok) throw new Error(typeof data === "string" ? raw : (data?.error || `HTTP ${r.status}`));

            setFlash("¡Oferta aceptada! La tarea pasó a assigned.");
            onAccepted(data); // ← notifica al padre (TaskDetail) con el deal
        } catch (e) {
            setErr(e.message || "No se pudo aceptar la oferta");
        } finally {
            setAcceptingId(null);
        }
    };

    if (loading) return <Spinner animation="border" />;
    if (err) return <Alert variant="danger" className="mt-2">{err}</Alert>;

    return (
        <Card>
            <Card.Header>Ofertas recibidas</Card.Header>
            <Card.Body className="pt-0">
                {flash && (
                    <Alert
                        variant="success"
                        dismissible
                        onClose={() => setFlash("")}
                        className="mt-3"
                    >
                        {flash}
                    </Alert>
                )}

                {offers.length === 0 ? (
                    <Alert variant="secondary" className="mt-3 mb-0">
                        Aún no hay ofertas para esta tarea.
                    </Alert>
                ) : (
                    <ListGroup className="mt-3">
                        {offers.map((o) => (
                            <ListGroup.Item key={o.id} className="d-flex justify-content-between align-items-start">
                                <div>
                                    <div className="fw-semibold">
                                        {usernames[o.tasker_id] ?? `Tasker #${o.tasker_id}`}{" "}
                                        <Badge bg={o.status === "accepted" ? "success" : (o.status === "pending" ? "secondary" : "info")}>
                                            {o.status || "pending"}
                                        </Badge>
                                    </div>
                                    <div>Monto: <strong>${Number(o.amount).toLocaleString()}</strong></div>
                                    {o.message && <div className="text-muted small">“{o.message}”</div>}
                                </div>

                                <div>
                                    {canAccept && o.status !== "accepted" && (
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => acceptOffer(o)}
                                            disabled={acceptingId === o.id}
                                        >
                                            {acceptingId === o.id ? "Aceptando..." : "Aceptar oferta"}
                                        </Button>
                                    )}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </Card.Body>
        </Card>
    );
}