// src/front/pages/TaskDetail.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Spinner, Alert, Container, Row, Col, Card, Badge, Button, Tabs, Tab } from "react-bootstrap";
import SendOfferModal from "../components/SendOfferModal";
import ReviewTaskerModal from "../components/ReviewTaskerModal";
import TaskChat from "../components/TaskChat";
import OfferList from "../components/OfferList";              // ← NUEVO
import { useStore } from "../hooks/useGlobalReducer";
import { TaskSessionProvider } from "../context/TaskSessionContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export default function TaskDetail() {
  const { store } = useStore();
  const currentUser = store?.user || null;

  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [existingOffer, setExistingOffer] = useState(null);
  const [checkingOffer, setCheckingOffer] = useState(false);

  const [flash, setFlash] = useState("");
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [publisher, setPublisher] = useState(null);
  const [tasker, setTasker] = useState(null);

  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [completing, setCompleting] = useState(false);

  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const qsOpenReview = qs.get("openReview") === "1";
  const qsTaskerId = qs.get("taskerId");
  const qsDealId = qs.get("dealId");

  // 1) cargar task
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const base = (API_BASE || "").replace(/\/+$/, "");
        const url = `${base}/api/tasks/${taskId}`;
        const res = await fetch(url);
        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();
        const data = ct.includes("application/json") ? JSON.parse(raw) : raw;
        if (!res.ok) throw new Error(typeof data === "string" ? `HTTP ${res.status}: ${data.slice(0, 120)}` : (data?.message || `HTTP ${res.status}`));
        setTask(data);
      } catch (e) {
        setError(e.message || "No se pudo cargar la tarea");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  // 1.b) cargar publisher y tasker asignado
  useEffect(() => {
    if (!task) return;
    const base = (API_BASE || "").replace(/\/+$/, "");

    if (task.publisher_id) {
      fetch(`${base}/api/users/${task.publisher_id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setPublisher(data))
        .catch(() => setPublisher(null));
    }

    if (task.assigned_tasker_id) {
      fetch(`${base}/api/users/${task.assigned_tasker_id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setTasker(data))
        .catch(() => setTasker(null));
    }
  }, [task]);

  // si la tarea está completed, verificar si ya existe review
  useEffect(() => {
    if (!task || task.status !== "completed") {
      setAlreadyReviewed(false);
      return;
    }
    const run = async () => {
      setLoadingReviews(true);
      try {
        const base = (API_BASE || "").replace(/\/+$/, "");
        const res = await fetch(`${base}/api/tasks/${taskId}/reviews`);
        const list = res.ok ? await res.json() : [];
        setAlreadyReviewed(Array.isArray(list) && list.length > 0);
      } catch {
        setAlreadyReviewed(false);
      } finally {
        setLoadingReviews(false);
      }
    };
    run();
  }, [task, taskId]);

  // 2) si hay tasker logueado, buscar si ya ofertó para esta task
  useEffect(() => {
    const run = async () => {
      setExistingOffer(null);
      if (!currentUser?.id || currentUser?.role !== "tasker" || !taskId) return;
      setCheckingOffer(true);
      try {
        const base = (API_BASE || "").replace(/\/+$/, "");
        const url = `${base}/api/tasks/${taskId}/offers?tasker_id=${currentUser.id}`;
        const res = await fetch(url);
        if (res.status === 404) { setExistingOffer(null); return; }
        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();
        const data = ct.includes("application/json") ? JSON.parse(raw) : raw;
        if (!res.ok) throw new Error(typeof data === "string" ? data : (data?.message || `HTTP ${res.status}`));
        const offer =
          (data && data.offer) ? data.offer :
            (Array.isArray(data) ? data.find(o => o?.tasker_id === currentUser.id) : null);
        setExistingOffer(offer || null);
      } catch {
        setExistingOffer(null);
      } finally {
        setCheckingOffer(false);
      }
    };
    run();
  }, [currentUser?.id, currentUser?.role, taskId]);

  // abrir modal de review si ?openReview=1 (una sola vez)
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (!loading && qsOpenReview && !autoOpenedRef.current) {
      setShowReviewModal(true);
      autoOpenedRef.current = true;
    }
  }, [loading, qsOpenReview]);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger" className="mt-3">{error}</Alert>;
  if (!task) return <Alert variant="warning">Tarea no encontrada</Alert>;

  // ====== permisos ======
  const isPublisher = !!currentUser && task?.publisher_id === currentUser?.id;

  const canSendOffer =
    !!currentUser &&
    currentUser.role === "tasker" &&
    !isPublisher &&
    task?.status === "open";

  const canChat =
    ["assigned", "in_progress", "completed"].includes(task?.status) &&
    !!currentUser &&
    (task?.publisher_id === currentUser.id || task?.assigned_tasker_id === currentUser.id);

  const canReviewTasker =
    task?.status === "completed" &&
    currentUser?.role === "client" &&
    isPublisher &&
    !!task?.assigned_tasker_id &&
    !alreadyReviewed;

  const handleOfferSaved = (saved) => {
    setFlash(existingOffer ? "¡Oferta actualizada!" : "¡Oferta enviada!");
    setExistingOffer(saved);
  };

  const handleReviewCreated = () => {
    setAlreadyReviewed(true);
    setFlash("¡Calificación enviada con éxito!");
    setShowReviewModal(false);
  };

  const handleMarkCompleted = async () => {
    if (!task?.id) return;
    setError("");
    try {
      const base = (API_BASE || "").replace(/\/+$/, "");
      const res = await fetch(`${base}/api/tasks/${task.id}/complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();
      const data = ct.includes("application/json") ? JSON.parse(raw) : raw;
      if (!res.ok) throw new Error(typeof data === "string" ? raw : (data?.message || `HTTP ${res.status}`));
      setTask(data);
      setFlash("¡Tarea marcada como completada!");
    } catch (e) {
      setError(e.message || "No se pudo completar la tarea");
    }
  };

  // ← NUEVO: cuando aceptas oferta desde OfferList
  const handleOfferAccepted = (deal) => {
    // deal trae: task_id, tasker_id, status='accepted', etc.
    setTask((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: "assigned",
        assigned_tasker_id: deal.tasker_id,
        assigned_at: prev.assigned_at || deal.accepted_at || prev.assigned_at,
      };
    });
    setFlash("¡Oferta aceptada! Ya puedes chatear con el tasker.");
  };

  return (
    <TaskSessionProvider task={task} currentUser={currentUser}>
      <Container className="py-4">
        {flash && (
          <Alert variant="success" onClose={() => setFlash("")} dismissible className="mb-3">
            {flash}
          </Alert>
        )}

        <Row className="mb-3">
          <Col>
            <h1 className="mb-1">{task.title}</h1>
            {task.status && <Badge bg="info">{task.status}</Badge>}
          </Col>
        </Row>

        <Row>
          {/* Izquierda: Tabs */}
          <Col md={8}>
            <Tabs defaultActiveKey="detalle" className="mb-3" fill>
              <Tab eventKey="detalle" title="Detalle">
                <Card className="mb-3">
                  <Card.Header>Descripción</Card.Header>
                  <Card.Body>
                    <p>{task.description || "Sin descripción"}</p>
                  </Card.Body>
                </Card>
              </Tab>

              {/* SOLO publisher ve ofertas, sobre todo cuando la tarea está open */}
              {isPublisher && (
                <Tab eventKey="offers" title="Ofertas">
                  <OfferList
                    taskId={task.id}
                    canAccept={task.status === "open"}
                    onAccepted={handleOfferAccepted}
                  />
                </Tab>
              )}

              {canChat && (
                <Tab eventKey="chat" title="Chat">
                  <Card className="mb-3">
                    <Card.Header>Mensajes de la tarea</Card.Header>
                    <Card.Body>
                      <TaskChat taskId={task.id} user={currentUser} demo={false} />
                    </Card.Body>
                  </Card>
                </Tab>
              )}
            </Tabs>
          </Col>

          {/* Derecha: Detalles + botones */}
          <Col md={4}>
            <Card className="mb-3">
              <Card.Header>Detalles</Card.Header>
              <Card.Body>
                {task.price != null && <p><strong>Precio:</strong> ${Number(task.price).toLocaleString()}</p>}
                {task.location && <p><strong>Ubicación:</strong> {task.location}</p>}
                <p><strong>Publicado por:</strong> {publisher?.username || task.publisher_id}</p>
                <Link to={`/u/${task.publisher_id}`}>Ver perfil</Link>
                {task.assigned_tasker_id && (
                  <p className="mt-2"><strong>Tasker asignado:</strong> {tasker?.username || task.assigned_tasker_id}</p>
                )}
              </Card.Body>
            </Card>

            {/* Oferta (lado tasker) */}
            {canSendOffer && (
              <>
                {checkingOffer ? (
                  <Alert variant="secondary">Verificando tu oferta previa…</Alert>
                ) : existingOffer ? (
                  <Alert variant="info" className="mb-2">
                    Ya ofertaste: <strong>${Number(existingOffer.amount).toLocaleString()}</strong>. Puedes actualizar tu oferta.
                  </Alert>
                ) : null}

                <Button
                  variant="primary"
                  className="me-2 mb-2"
                  onClick={() => setShowOfferModal(true)}
                >
                  {existingOffer ? "Actualizar oferta" : "Enviar oferta"}
                </Button>
              </>
            )}

            {/* Completar tarea (solo publisher; cuando está asignada/en progreso) */}
            {isPublisher && ["assigned", "in_progress"].includes(task?.status) && (
              <Button
                variant="outline-success"
                className="mb-2"
                onClick={handleMarkCompleted}
              >
                {completing ? "Marcando..." : "Marcar como completada"}
              </Button>

            )}
            {/* Generar disputa (solo client/publisher) */}
            {isPublisher && ["assigned", "in_progress"].includes(task?.status) && (
              <Button
                variant="danger"
                className="mb-2"
              >
                Generar disputa
              </Button>
            )}
            {/* Calificar */}
            {task?.status === "completed" && currentUser?.role === "client" && isPublisher && !!task?.assigned_tasker_id && (
              <div>
                <Button
                  variant="success"
                  className="mb-2"
                  onClick={() => setShowReviewModal(true)}
                  disabled={loadingReviews || alreadyReviewed}
                >
                  {alreadyReviewed ? "Tasker ya calificado" : "Calificar tasker"}
                </Button>
                {loadingReviews && <div className="small text-muted">Verificando si ya calificaste…</div>}
              </div>
            )}
          </Col>
        </Row>

        {/* Modales */}
        <SendOfferModal
          show={showOfferModal}
          onHide={() => setShowOfferModal(false)}
          taskId={task.id}
          onCreated={handleOfferSaved}
          existingOffer={existingOffer}
        />

        <ReviewTaskerModal
          show={showReviewModal}
          onHide={() => setShowReviewModal(false)}
          taskId={task.id}
          taskerId={Number(qsTaskerId) || task.assigned_tasker_id}
          dealId={qsDealId ? Number(qsDealId) : undefined}
          onCreated={handleReviewCreated}
          demo={false}
        />
      </Container>
    </TaskSessionProvider>
  );
}
